const transaksiModel = require('../models/transaksi');
const sembakoModel = require('../models/sembako');
const mongoose = require('mongoose');
const objectId = mongoose.Types.ObjectId;

exports.create = (data) =>
    new Promise(async (resolve, reject) => {
      const idBarang = data.idBarang;
      const jumlahBeli = parseInt(data.jumlah);
  
      const isDev = process.env.NODE_ENV !== 'production';
  
      if (isDev) {
        try {
          const barang = await sembakoModel.findOne({ _id: idBarang });
          if (!barang) throw new Error("Barang tidak ditemukan");
  
          if (barang.stok - barang.stokReserved < jumlahBeli)
            throw new Error("Stok sedang diproses oleh user lain");
  
          await sembakoModel.updateOne(
            { _id: idBarang },
            { $inc: { stokReserved: jumlahBeli } }
          );
  
          await transaksiModel.create({
            ...data,
            status: 'pending'
          });
  
          resolve({
            sukses: true,
            msg: 'Transaksi berhasil dicatat',
          });
        } catch (error) {
          reject({
            sukses: false,
            msg: error.message || 'Gagal Transaksi',
          });
        }
      } else {
        // Jika production: pakai transaksi
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          const barang = await sembakoModel.findOne({ _id: idBarang }).session(session);
          if (!barang) throw new Error("Barang tidak ditemukan");
  
          if (barang.stok - barang.stokReserved < jumlahBeli)
            throw new Error("Stok sedang diproses oleh user lain");
  
          await sembakoModel.updateOne(
            { _id: idBarang },
            { $inc: { stokReserved: jumlahBeli } },
            { session }
          );
  
          await transaksiModel.create([{ 
            ...data, 
            status: 'pending' 
          }], { session });
  
          await session.commitTransaction();
          session.endSession();
  
          resolve({
            sukses: true,
            msg: 'Berhasil Transaksi',
          });
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          reject({
            sukses: false,
            msg: error.message || 'Gagal Transaksi',
          });
        }
      }
    });



    exports.uploadBuktiBayar = (id, data) =>
        new Promise(async (resolve, reject) => {
          const isDev = process.env.NODE_ENV !== 'production';
      
          if (isDev) {
            // 💻 MODE DEV: TANPA TRANSAKSI
            try {
              const transaksi = await transaksiModel.findOne({ _id: id });
              if (!transaksi) throw new Error("Transaksi tidak ditemukan");
      
              const barang = await sembakoModel.findOne({ _id: transaksi.idBarang });
              if (!barang) throw new Error("Barang tidak ditemukan");
      
              const jumlahBeli = transaksi.jumlah;
              if (barang.stok < jumlahBeli) throw new Error("Stok tidak mencukupi");
      
              // Kurangi stok & stokReserved
              await sembakoModel.updateOne(
                { _id: transaksi.idBarang },
                {
                  $inc: {
                    stok: -jumlahBeli,
                    stokReserved: -jumlahBeli
                  }
                }
              );
      
              // Update transaksi dengan bukti bayar
              await transaksiModel.updateOne(
                { _id: id },
                {
                  $set: {
                    ...data,
                    status: 'berhasil'
                  }
                }
              );
              
              resolve({
                sukses: true,
                msg: 'Berhasil Upload Bukti',
              });
            } catch (error) {
              reject({
                sukses: false,
                msg: error.message || 'Gagal Upload Bukti',
              });
            }
          } else {
            // 🌐 PRODUCTION MODE (pakai transaksi)
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
              const transaksi = await transaksiModel.findOne({ _id: id }).session(session);
              if (!transaksi) throw new Error("Transaksi tidak ditemukan");
      
              const barang = await sembakoModel.findOne({ _id: transaksi.idBarang }).session(session);
              if (!barang) throw new Error("Barang tidak ditemukan");
      
              const jumlahBeli = transaksi.jumlah;
              if (barang.stok < jumlahBeli) throw new Error("Stok tidak mencukupi");
      
              // Kurangi stok & stokReserved
              await sembakoModel.updateOne(
                { _id: transaksi.idBarang },
                {
                  $inc: {
                    stok: -jumlahBeli,
                    stokReserved: -jumlahBeli
                  }
                },
                { session }
              );
      
              // Update transaksi dengan bukti bayar
              await transaksiModel.updateOne(
                { _id: id },
                {
                  $set: {
                    ...data,
                    status: 'berhasil'
                  }
                },
                { session }
              );
              
      
              await session.commitTransaction();
              session.endSession();
      
              resolve({
                sukses: true,
                msg: 'Berhasil Upload Bukti',
              });
            } catch (error) {
              await session.abortTransaction();
              session.endSession();
              reject({
                sukses: false,
                msg: error.message || 'Gagal Upload Bukti',
              });
            }
          }
        });
      
      

exports.getall = () =>
    new Promise((resolve, reject) => {
        try {
            transaksiModel.aggregate([
                {
                    $lookup: {
                        from: 'sembakos',
                        localField: 'idBarang',
                        foreignField: '_id',
                        as: 'dataBarang'
                    }
                },
                {
                    $unwind: '$dataBarang'
                }
            ]).then((data) => {
                resolve({
                    sukses: true,
                    msg: 'Berhasil',
                    data: data
                })
            }).catch((e) => {
                reject({
                    sukses: false,
                    msg: 'Gagal',
                    data: []
                })
            })
        } catch (error) {
            console.log(error)
        }
    })

exports.getByIdUser = (id) =>
    new Promise((resolve, reject) => {
        try {
            transaksiModel.aggregate([
                {
                    $lookup: {
                        from: 'sembakos',
                        localField: 'idBarang',
                        foreignField: '_id',
                        as: 'dataBarang'
                    }
                },
                {
                    $unwind: '$dataBarang'
                },
                {
                    $match: {
                        idUser: objectId(id)
                    }
                },
                { $sort: { _id: -1 } }
            ]).then((data) => {
                resolve({
                    sukses: true,
                    msg: 'Berhasil',
                    data: data
                })
            }).catch((e) => {
                reject({
                    sukses: false,
                    msg: 'Gagal',
                    data: []
                })
            })
        } catch (error) {
            console.log(error)
        }
    })

exports.getByIdUserLimit = (id, limit) =>
    new Promise((resolve, reject) => {
        try {
            transaksiModel.aggregate([
                {
                    $lookup: {
                        from: 'sembakos',
                        localField: 'idBarang',
                        foreignField: '_id',
                        as: 'dataBarang'
                    }
                },
                {
                    $unwind: '$dataBarang'
                },
                {
                    $match: {
                        idUser: objectId(id)
                    }
                },
                { $sort: { _id: -1 } },
                {
                    $limit: 2,
                },

            ]).then((data) => {
                resolve({
                    sukses: true,
                    msg: 'Berhasil',
                    data: data
                })
            }).catch((e) => {
                reject({
                    sukses: false,
                    msg: 'Gagal',
                    data: []
                })
            })
        } catch (error) {
            console.log(error)
        }
    })

    // di transaksiController.js
    exports.delete = (id) =>
        new Promise(async (resolve, reject) => {
          try {
            const transaksi = await transaksiModel.findOne({ _id: id });
            if (!transaksi) throw new Error("Transaksi tidak ditemukan");
      
            const idBarang = transaksi.idBarang;
            const jumlah = transaksi.jumlah;
      
            // Kembalikan stokReserved
            await sembakoModel.updateOne(
              { _id: idBarang },
              { $inc: { stokReserved: -jumlah } }
            );
      
            // Hapus transaksi
            await transaksiModel.deleteOne({ _id: id });
      
            resolve({
              sukses: true,
              msg: 'Berhasil menghapus transaksi'
            });
          } catch (e) {
            reject({
              sukses: false,
              msg: e.message || 'Gagal menghapus transaksi',
            });
          }
        });
      
      
