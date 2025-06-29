const mongoose = require('mongoose')
const Schema = mongoose.Schema
const objectId = mongoose.Types.ObjectId

const transaksiSchema = new Schema({
    idBarang:{
        type:objectId
    },
    idUser:{
        type:objectId
    },
    jumlah:{
        type:Number
    },
    harga:{
        type:Number
    },
    total:{
        type:Number
    },
    tanggal:{
        type:Date,
        default:Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'dibayar', 'selesai', 'dibatalkan'],
        default: 'pending',
    },      
    buktiPembayaran:{
        type:String
    },
    alamatpenerima:{
        type:String
    }
}, { timestamps: true });


module.exports=mongoose.model('transaksi',transaksiSchema)