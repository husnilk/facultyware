const db = require('../lib/db');

exports.getAllCategories = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories ORDER BY id DESC');
        
        res.render('kategori/index', { 
            title: 'Kelola Data Kategori', 
            categories: rows 
        });
    } catch (err) {
        console.error('Error fetching categories:', err);
        next(err);
    }
};

exports.createCategoryForm = (req, res) => {
    res.render('kategori/create', { title: 'Tambah Kategori Baru' });
};

exports.createCategorySubmit = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        
        await db.query(
            'INSERT INTO categories (name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())', 
            [name, description]
        );
        
        res.redirect('/kategori');
    } catch (err) {
        console.error('Error insert kategori:', err);
        next(err);
    }
};

exports.editCategoryForm = async (req, res, next) => {
    try {
        const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).send('Kategori tidak ditemukan');
        }
        res.render('kategori/edit', { 
            title: 'Edit Kategori', 
            category: rows[0] 
        });
    } catch (err) {
        console.error('Error fetching category for edit:', err);
        next(err);
    }
};

exports.editCategorySubmit = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        await db.query(
            'UPDATE categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?', 
            [name, description, req.params.id]
        );
        res.redirect('/kategori');
    } catch (err) {
        console.error('Error update kategori:', err);
        next(err);
    }
};

exports.deleteCategory = async (req, res, next) => {
    try {
        await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
        res.redirect('/kategori');
    } catch (err) {
        console.error('Error delete kategori:', err);
        next(err);
    }
};