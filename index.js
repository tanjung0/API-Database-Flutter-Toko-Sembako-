const express = require('express')
const app = express()
const mongoose = require('mongoose')
const mongoUrl = 'mongodb://localhost:27017/tokosembako'
const cors = require('cors')
const path = require('path')

mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Berhasil Connect Ke Database')
}).catch((e) => {
    console.log(e)
    console.log('Gagal Connect Ke Database')
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

const directory = path.join(__dirname, '/static/')
app.use(express.static(directory))

app.use('/user', require('./routes/user'))
app.use('/sembako', require('./routes/sembako'))
app.use('/transaksi', require('./routes/transaksi'))

app.listen(5001, () => {
    console.log('Berhasil Jalan')
})