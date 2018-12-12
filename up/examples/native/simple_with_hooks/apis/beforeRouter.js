module.exports = (req, res, next) => {
  console.log('*** beforeRouter ***');
  next();
};