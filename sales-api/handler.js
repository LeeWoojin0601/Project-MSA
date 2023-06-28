const serverless = require("serverless-http");
const express = require("express");

const app = express();
app.use(express.json())

const AWS = require("aws-sdk") // STEP 2
// const sns = new AWS.SNS({ region: "ap-northeast-2" }) // STEP 2



// AWS SDK 구성
const region = 'ap-northeast-2'; // 리전 설정
const snsTopicArn = process.env.TOPIC_ARN; // Serverless Framework로부터 받은 SNS TOPIC ARN
const sqsQueueArn = process.env.STOCK_QUEUE_ARN; // Serverless Framework로부터 받은 SQS 큐 ARN

const sns = new AWS.SNS({ region });
const sqs = new AWS.SQS({ region });

// SNS 구독 생성 함수
const createSnsSubscription = async () => {
  try {
    // SNS 구독 정보 가져오기
    const listSubscriptionsParams = {
      TopicArn: snsTopicArn,
    };
    const { Subscriptions } = await sns.listSubscriptionsByTopic(listSubscriptionsParams).promise();

    // SQS에 대한 SNS 구독이 이미 존재하는지 확인
    const existingSubscription = Subscriptions.find((sub) => {
      return sub.Protocol === 'sqs' && sub.Endpoint === sqsQueueArn;
    });

    if (!existingSubscription) {
      // SNS 구독 생성 파라미터 설정
      const subscribeParams = {
        TopicArn: snsTopicArn,
        Protocol: 'sqs',
        Endpoint: sqsQueueArn,
      };

      // SNS 구독 생성 실행
      const { SubscriptionArn } = await sns.subscribe(subscribeParams).promise();

      console.log('SNS subscription for SQS created successfully.');
      console.log('Subscription ARN:', SubscriptionArn);
    } else {
      console.log('SNS subscription for SQS already exists.');
    }
  } catch (error) {
    console.error('Error creating SNS subscription:', error);
  }
};

// SQS 구독 생성 함수
const createSqsSubscription = async () => {
  try {
    // SQS 큐의 구독 정보 가져오기
    const listSubscriptionsParams = {
      QueueUrl: sqsQueueArn,
    };
    const { Subscriptions } = await sqs.listSubscriptionsByQueue(listSubscriptionsParams).promise();

    // SNS 구독이 이미 존재하는지 확인
    const existingSubscription = Subscriptions.find((sub) => {
      return sub.TopicArn === snsTopicArn;
    });

    if (!existingSubscription) {
      // SQS에 대한 SNS 구독 생성 파라미터 설정
      const subscribeParams = {
        QueueUrl: sqsQueueArn,
        TopicArn: snsTopicArn,
      };

      // SQS에 대한 SNS 구독 생성 실행
      await sqs.subscribe(subscribeParams).promise();

      console.log('SQS subscription for SNS created successfully.');
    } else {
      console.log('SQS subscription for SNS already exists.');
    }
  } catch (error) {
    console.error('Error creating SQS subscription:', error);
  }
};

// 비동기 함수 호출
(async () => {
  // SNS 구독 생성 함수 호출
  await createSnsSubscription();

  // SQS 구독 생성 함수 호출
  await createSqsSubscription();
})();


// 첫 배포시 생성되는 SQS가 동작안하는 ISSUE가 발생하였는데, 로직으로 지웠다가 다시 생성해도 동일했음
// 결국엔 메뉴얼로  SQS 구독을 지웠다가 다시 만드니 정상 작동

//  -----------------------------------------------------------------------------------



const {
  connectDb,
  queries: { getProduct, setStock }
} = require('./database')


//상품 조회 로직
app.get("/product/donut", connectDb, async (req, res, next) => {
  const [ result ] = await req.conn.query(
    getProduct('CP-502101')
  )

  await req.conn.end()
  if (result.length > 0) {
    return res.status(200).json(result[0]);
  } else {
    return res.status(400).json({ message: "상품 없음" });
  }
});


// app.post("/checkout", connectDb, async (req, res, next) => {
//   const [ result ] = await req.conn.query(
//     getProduct('CP-502101')
//   )
//   if (result.length > 0) {
//     const product = result[0]
//     if (product.stock > 0) {
//       await req.conn.query(setStock(product.product_id, product.stock - 1))
//       return res.status(200).json({ message: `구매 완료! 남은 재고: ${product.stock - 1}`});
//     }
//     else {
//       await req.conn.end()
//       return res.status(200).json({ message: `구매 실패! 남은 재고: ${product.stock}`});
//     }
//   } else {
//     await req.conn.end()
//     return res.status(400).json({ message: "상품 없음" });
//   }
// });

//상품 구매 로직
app.post('/checkout', connectDb, async (req, res, next) => {
  try {
    const [result] = await req.conn.query(getProduct('CP-502101'));
    if (result.length > 0) {
      const product = result[0];
      if (product.stock > 0) {
        await req.conn.query(setStock(product.product_id, product.stock - 1));
        return res.status(200).json({ message: `구매 완료! 남은 재고: ${product.stock - 1}` });
      } else {
        // 재고가 없을 경우 재고 부족 메시지 발행
        const now = new Date().toString();
        const message = `도너츠 재고가 없습니다. 제품을 생산해주세요! \n메시지 작성 시각: ${now}`;
        const params = {
          Message: message,
          Subject: '도너츠 재고 부족',
          MessageAttributes: {
            MessageAttributeProductId: {
              StringValue: product.product_id,
              DataType: 'String',
            },
            MessageAttributeFactoryId: {
              StringValue: product.factory_id,
              DataType: 'String',
            },
            MessageAttributeProductCnt: {
              StringValue: `${req.body.stock}`,
              DataType: 'Number',
            },
            MessageAttributeRequester: {
              StringValue: req.body.MessageAttributeRequester,
              DataType: 'String',
            },
          },
          TopicArn: process.env.TOPIC_ARN,
        };

        const result = await sns.publish(params).promise(); // SNS에 메시지 발행

        await req.conn.end();
        return res.status(200).json({ message: `구매 실패! 남은 재고: ${product.stock}` });
      }
    } else {
      await req.conn.end();
      return res.status(400).json({ message: '상품 없음' });
    }
  } catch (error) {
    console.error('Error processing checkout:', error);
    await req.conn.end();
    return res.status(500).json({ message: '구매 처리에 실패하였습니다.' });
  }
});





app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
module.exports.app = app;
