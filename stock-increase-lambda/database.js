const mysql = require('mysql2/promise');
require('dotenv').config()

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
  SELECT BIN_TO_UUID(product_id) as product_id, name, price, stock, BIN_TO_UUID(factory_id), BIN_TO_UUID(ad_id)
  FROM product
  WHERE sku = "${sku}"
`

const increaseStock = (productId, incremental) => `
  UPDATE product SET stock = stock + ${incremental} WHERE product_id = UUID_TO_BIN('${productId}')
`

module.exports = {
  connectDb,
  queries: {
    getProduct,
    increaseStock
  }
}