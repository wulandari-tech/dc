const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
    roleId: String,
    roleName: String,
    price: Number
});

module.exports = mongoose.model('Shop', ShopSchema);