const sembakoModel = require('../models/sembako')

exports.create = (data) =>
  new Promise((resolve, reject) => {
    sembakoModel.create(data)
      .then(() => {
        resolve({
          sukses: true,
          msg: 'Berhasil Menyimpan Data'
        })
      }).catch((e) => {
        console.log(e)
        reject({
          sukses: false,
          msg: 'Gagal Menyimpan Data'
        })
      })
  })

exports.getData = () =>
  new Promise((resolve, reject) => {
    sembakoModel.find({})
      .then(res => {
        resolve({
          sukses: true,
          msg: 'Berhasil Mengambil Data',
          data: res
        })
      }).catch(() => reject({
        sukses: false,
        msg: 'Gagal Mengmabil Data',
        data: []
      }))
  })

exports.getById = (id) =>
  new Promise((resolve, reject) => {
    sembakoModel.findOne({
      _id: id
    })
      .then(res => {
        resolve({
          sukses: true,
          msg: 'Berhasil Mengambil Data',
          data: res
        })
      }).catch(() => reject({
        sukses: false,
        msg: 'Gagal Mengmabil Data',
        data: {}
      }))
  })

exports.edit = (id, data) =>
  new Promise((resolve, reject) => {
    sembakoModel.updateOne({
      _id: id
    }, data).then(() => resolve({
      sukses: true,
      msg: 'Berhasil Edit Data'
    })).catch(() => reject({
      sukses: false,
      msg: 'Gagal Edit Data'
    }))
  })

exports.delete = (id) =>
  new Promise((resolve, reject) => {
    sembakoModel.deleteOne({
      _id: id
    }).then(() => resolve({
      sukses: true,
      msg: 'Berhasil Hapus Data'
    })).catch(() => reject({
      sukses: false,
      msg: 'Gagal Hapus Data'
    }))
  })