// const { json } = require('express');

// const axios = require('axios').default;
// exports.handler = async (event) => {
//   for (const record of event.Records) {
//     console.log(event)
//     console.log(`Body Data: ${record.body}`)

//     const json= JSON.parse(record.body).MessageAttribute

//     console.log("-----------------")
//     console.log(`필요데이터 : ${JSON.stringify(json)}`);
//     console.log(`Product ID: ${record.body.MessageAttributeProductId.Value}`)
//     console.log(`Product Count: ${json.MessageAttributeProductCnt.Value}`)
//     console.log(`Factory ID: ${json.MessageAttributeFactoryId.Value}`)
//     console.log(`Requester: ${json.MessageAttributeRequester.Value}`)
//   try {
//     const payload = {
//       // TODO: Factory API에 필요한 정보를 payload에 추가
//       MessageGroupId : "stock-arrival-group",
//       MessageAttributeProductId : json.MessageAttributeProductId.Value,
//       MessageAttributeProductCnt : json.MessageAttributeProductCnt.Value,
//       MessageAttributeFactoryId : json.MessageAttributeFactoryId.Value,
//       MessageAttributeRequester : json.MessageAttributeRequester.Value,
//       Callbackurl : "https://s69p4krhg3.execute-api.ap-northeast-2.amazonaws.com/product/donut"
//     };

//     const response = await axios.post('http://project3-factory.coz-devops.click/api/manufactures', payload);
//     console.log(response.data);
//     return {
//       statusCode: 200,
//       body: '생산 요청이 완료되었습니다.',
//     };
//   } catch (error) {
//     console.log(error);
//     return {
//       statusCode: 500,
//       body: '생산 요청이 실패하였습니다.',
//     };
//   }
// }
// };

const axios = require('axios').default;

const consumer = async (event) => {
  for (const record of event.Records) {
    console.log(`body로 전달받은 데이터 확인 : ${record.body}`); // 확인용
    const json = JSON.parse(record.body).MessageAttributes;

    console.log(`필요데이터 : ${JSON.stringify(json)}`);
    console.log(`상품ID : ${json.MessageAttributeProductId.Value}`);
    console.log(`상품 수 : ${json.MessageAttributeProductCnt.Value}`);
    console.log(`공장ID : ${json.MessageAttributeFactoryId.Value}`);
    console.log(`요청자 : ${json.MessageAttributeRequester.Value}`);
   
    const payload = {
      MessageGroupId: 'stock-arrival-group',
      MessageAttributeProductId: json.MessageAttributeProductId.Value,
      MessageAttributeProductCnt: json.MessageAttributeProductCnt.Value,
      MessageAttributeFactoryId: json.MessageAttributeFactoryId.Value,
      MessageAttributeRequester: json.MessageAttributeRequester.Value,
      CallbackUrl: "https://s69p4krhg3.execute-api.ap-northeast-2.amazonaws.com/product/donut" // 데이터베이스에 재고를 추가할 리소스의 주소 // increase url/producy/dount로
    };

    axios.post('http://project3-factory.coz-devops.click/api/manufactures', payload)
      .then(function (response) {
        console.log(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });
  }
};

module.exports = {
  consumer,
};