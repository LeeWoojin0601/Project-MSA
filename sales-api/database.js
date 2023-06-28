const mysql = require('mysql2/promise');
require('dotenv').config()

// const {
//   HOSTNAME: host,
//   USERNAME: user,
//   PASSWORD: password,
//   DATABASE: database
// } = process.env;

// const connectDb = async (req, res, next) => {
//   try {
//     req.conn = await mysql.createConnection({ host, user, password, database })
//     next()
//   }
//   catch(e) {
//     console.log(e)
//     res.status(500).json({ message: "데이터베이스 연결 오류" })
//   }
// }


const getDatabaseCredentials = () => {
  // 인증 정보를 가져오는 로직을 구현하세요
  const host = process.env.host.replace('https://', '');
  const user = process.env.user;
  const password = process.env.password;
  const database = process.env.database;

  return { host, user, password, database };
};

const connectDb = async (req, res, next) => {
  try {
    const dbCredentials = await getDatabaseCredentials();
    req.conn = await mysql.createConnection(dbCredentials);
    next();
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: '데이터베이스 연결 오류' });
  }
};

const getProduct = (sku) => `
  SELECT BIN_TO_UUID(product_id) as product_id, name, price, stock, BIN_TO_UUID(factory_id) as factory_id, BIN_TO_UUID(ad_id)
  FROM product
  WHERE sku = "${sku}"
`

const setStock = (productId, stock) => `
  UPDATE product SET stock = ${stock} WHERE product_id = UUID_TO_BIN('${productId}')
`

module.exports = {
  connectDb,
  queries: {
    getProduct,
    setStock
  }
}