function generateRandomId() {
  const characters = 'abcdefghjklmnpqrstuvwxyz0123456789'; // 排除i和o
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
}

module.exports = {
  generateRandomId: generateRandomId
};