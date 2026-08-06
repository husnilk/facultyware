const db = require('../lib/db');
const fs = require('fs');

exports.getAllItems = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM items ORDER BY id DESC');
        res.render('item/index', { title: 'Kelola Data Item', items: rows });
    } catch (err) {
        next(err);
    }
};

exports.createItemForm = async (req, res, next) => {
    try {
        const [kategori] = await db.query('SELECT * FROM categories');
        
        res.render('item/create', { 
            title: 'Tambah Item Baru', 
            kategori: kategori 
        });
    } catch (err) {
        next(err);
    }
};

exports.createItemSubmit = async (req, res, next) => {
    try {
        const { code, name, unit, minimal_quantity, description } = req.body;

        await db.query(
            'INSERT INTO items (code, name, unit, minimal_quantity, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
            [code, name, unit, minimal_quantity, description]
        );
        res.redirect('/item');
    } catch (err) {
        next(err);
    }
};

exports.editItemForm = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
        res.render('item/edit', { title: 'Edit Item', item: rows[0] });
    } catch (err) { next(err); }
};

exports.editItemSubmit = async (req, res, next) => {
    try {
        const { code, name, unit, minimal_quantity, description } = req.body;
        await db.query(
            'UPDATE items SET code=?, name=?, unit=?, minimal_quantity=?, description=?, updated_at=NOW() WHERE id=?',
            [code, name, unit, minimal_quantity, description, req.params.id]
        );
        res.redirect('/item');
    } catch (err) { next(err); }
};

exports.deleteItem = async (req, res, next) => {
    try {
        await db.query('DELETE FROM items WHERE id = ?', [req.params.id]);
        res.redirect('/item');
    } catch (err) { next(err); }
};

exports.searchItems = async (req, res, next) => {
    try {
        const keyword = req.query.q || '';
        const searchTerm = `%${keyword}%`;
        
        const [items] = await db.query(
            'SELECT * FROM items WHERE code LIKE ? OR name LIKE ? ORDER BY id DESC', 
            [searchTerm, searchTerm]
        );

        res.render('item/partials/table-rows', { items });
    } catch (err) {
        next(err);
    }
};
const XLSX = require('xlsx');

exports.exportItems = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT code, name, unit, minimal_quantity, description FROM items ORDER BY id DESC');
        
        const formattedRows = rows.map((item, index) => ({
            'No': index + 1,
            'Kode Item': item.code,
            'Nama Barang': item.name,
            'Satuan': item.unit,
            'Min. Stok': item.minimal_quantity,
            'Deskripsi': item.description || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedRows);

        worksheet['!cols'] = [
            { wch: 5 },
            { wch: 15 },
            { wch: 30 },
            { wch: 15 },
            { wch: 12 },
            { wch: 50 }
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Inventaris");
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
        
        res.setHeader('Content-Disposition', 'attachment; filename=Data_Inventaris_Facultyware.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(excelBuffer);
        
    } catch (err) { 
        next(err); 
    }
};

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

exports.upload = upload.single('file'); 

exports.importItems = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.send("<script>alert('Silahkan Pilih File.'); window.location='/item';</script>");
        }

        const file = req.file;

        const validMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        if (!validMimeTypes.includes(file.mimetype)) {
            fs.unlinkSync(file.path);
            return res.send("<script>alert('Error! File harus bertipe Excel (.xlsx atau .xls)'); window.location='/item';</script>");
        }

        try {
            const workbook = XLSX.readFile(file.path);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);

            for (const item of data) {
                const itemCode = item.code || item['Kode Item'];
                const itemName = item.name || item['Nama Barang'];
                const itemUnit = item.unit || item['Satuan'];
                const itemMinQty = item.minimal_quantity || item['Min. Stok'];
                const itemDesc = item.description || item['Deskripsi'] || '-';

                if (!itemCode || !itemName) continue;

                await db.query(
                    'INSERT INTO items (code, name, unit, minimal_quantity, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
                    [itemCode, itemName, itemUnit, itemMinQty, itemDesc]
                );
            }

            fs.unlinkSync(file.path);
            res.redirect('/item');

        } catch (readErr) {
            fs.unlinkSync(file.path);
            console.error('Error baca Excel:', readErr);
            return res.send("<script>alert('Isi file tidak bisa dibaca! Pastikan file berisi tabel Excel.'); window.location='/item';</script>");
        }

    } catch (err) { 
        next(err); 
    }
};