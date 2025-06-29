const cron = require('node-cron');
const mongoose = require('mongoose');
const Transaksi = require('../models/transaksi'); // Pastikan path sesuai struktur proyek kamu
const Sembako = require('../models/sembako');     // Pastikan path sesuai

// Jadwalkan setiap 30 menit
cron.schedule('*/30 * * * *', async () => {
  console.log('[CRON] Menjalankan pengecekan transaksi pending yang expired...');

  const batasWaktu = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 jam lalu

  try {
    const transaksiExpired = await Transaksi.find({
      buktiPembayaran: null,
      createdAt: { $lt: batasWaktu }
    });

    for (const trx of transaksiExpired) {
      await Sembako.findByIdAndUpdate(trx.idBarang, {
        $inc: { stok: trx.jumlah }
      });
    }

    const hasil = await Transaksi.deleteMany({
      buktiPembayaran: null,
      createdAt: { $lt: batasWaktu }
    });

    console.log(`[CRON] Hapus ${hasil.deletedCount} transaksi pending yang expired & stok dikembalikan`);
  } catch (error) {
    console.error('[CRON] Gagal hapus transaksi expired:', error);
  }
});
