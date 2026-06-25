const db = require("../lib/db");

// =========================================
// LIST SEMUA OPTION
// =========================================
const all = async (req, res, next) => {

    try {

        const [options] = await db.query(`
            SELECT
                survey_question_options.*,
                survey_questions.question_text
            FROM survey_question_options
            JOIN survey_questions
                ON survey_questions.id = survey_question_options.survey_question_id
            ORDER BY survey_question_options.id DESC
        `);

        res.render("option/all", {
            title: "Option",
            user: req.session.name,
            options
        });

    } catch (err) {
        next(err);
    }

};

// =========================================
// LIST OPTION BERDASARKAN QUESTION
// =========================================
const index = async (req, res, next) => {

    try {

        const questionId = req.params.id;

        const [questionRows] = await db.query(
            "SELECT * FROM survey_questions WHERE id=?",
            [questionId]
        );

        if (questionRows.length === 0) {
            return res.redirect("/question");
        }

        const [options] = await db.query(`
            SELECT *
            FROM survey_question_options
            WHERE survey_question_id=?
            ORDER BY weight ASC,id ASC
        `,[questionId]);

        res.render("option/index",{
            title:"Option",
            user:req.session.name,
            question:questionRows[0],
            options
        });

    } catch(err){
        next(err);
    }

};

// =========================================
// CREATE
// =========================================
const createForm = async (req,res,next)=>{

    try{

        const questionId=req.params.questionId;

        const [rows]=await db.query(
            "SELECT * FROM survey_questions WHERE id=?",
            [questionId]
        );

        if(rows.length===0){
            return res.redirect("/question");
        }

        res.render("option/create",{
            title:"Tambah Option",
            user:req.session.name,
            question:rows[0],
            error:null
        });

    }catch(err){
        next(err);
    }

};

// =========================================
// STORE
// =========================================
const store = async (req,res,next)=>{

    try{

        const questionId=req.params.questionId;

        const{
            option_text,
            weight
        }=req.body;

        await db.query(`
            INSERT INTO survey_question_options
            (
                survey_question_id,
                option_text,
                weight,
                created_at,
                updated_at
            )
            VALUES
            (?,?,?,NOW(),NOW())
        `,[
            questionId,
            option_text,
            weight
        ]);

        res.redirect("/option/question/"+questionId);

    }catch(err){
        next(err);
    }

};

// =========================================
// EDIT
// =========================================
const editForm = async (req,res,next)=>{

    try{

        const [rows]=await db.query(
            "SELECT * FROM survey_question_options WHERE id=?",
            [req.params.id]
        );

        if(rows.length===0){
            return res.redirect("/option");
        }

        res.render("option/edit",{
            title:"Edit Option",
            user:req.session.name,
            option:rows[0],
            error:null
        });

    }catch(err){
        next(err);
    }

};

// =========================================
// UPDATE
// =========================================
const update = async (req,res,next)=>{

    try{

        const{
            option_text,
            weight
        }=req.body;

        const [rows]=await db.query(
            "SELECT survey_question_id FROM survey_question_options WHERE id=?",
            [req.params.id]
        );

        if(rows.length===0){
            return res.redirect("/option");
        }

        const questionId=rows[0].survey_question_id;

        await db.query(`
            UPDATE survey_question_options
            SET
                option_text=?,
                weight=?,
                updated_at=NOW()
            WHERE id=?
        `,[
            option_text,
            weight,
            req.params.id
        ]);

        res.redirect("/option/question/"+questionId);

    }catch(err){
        next(err);
    }

};

// =========================================
// DELETE
// =========================================
const destroy = async (req,res,next)=>{

    try{

        const [rows]=await db.query(
            "SELECT survey_question_id FROM survey_question_options WHERE id=?",
            [req.params.id]
        );

        if(rows.length===0){
            return res.redirect("/option");
        }

        const questionId=rows[0].survey_question_id;

        await db.query(
            "DELETE FROM survey_question_options WHERE id=?",
            [req.params.id]
        );

        res.redirect("/option/question/"+questionId);

    }catch(err){
        next(err);
    }

};

module.exports={
    all,
    index,
    createForm,
    store,
    editForm,
    update,
    destroy
};