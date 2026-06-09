exports.index = (req, res) => {
    res.send(`
        <h1>Dashboard Pegawai</h1>

        <ul>
            <li><a href="/pegawai/cuti">Riwayat Pengajuan Cuti</a></li>
            <li><a href="/pegawai/cuti/tambah">Buat Pengajuan Cuti</a></li>
            <li><a href="/pegawai/notifikasi">Notifikasi</a></li>
        </ul>
    `);
};