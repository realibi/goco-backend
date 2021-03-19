const Pool = require('pg').Pool
const pool = new Pool({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'goco_db',
    password: 'root',
    port: 5432,
})

const getFeedbacks = (request, response) => {
    pool.query('SELECT * FROM feedbacks ORDER BY datetime DESC', (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getFeedbackById = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('SELECT * FROM feedbacks WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const createFeedback = (request, response) => {
    const { fullname, text, datetime } = request.body

    pool.query('INSERT INTO feedbacks (fullname, text, datetime) VALUES ($1, $2, $3)', [fullname, text, datetime], (error, result) => {
        if (error) {
            throw error
        }
        response.status(201).send(`User added with ID: ${result.insertId}`)
    })
}

const updateFeedback = (request, response) => {
    const id = parseInt(request.params.id)
    const { fullname, text, datetime } = request.body

    pool.query(
        'UPDATE feedbacks SET fullname = $1, text = $2, datetime = $3 WHERE id = $4',
        [fullname, text, datetime, id],
        (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).send(`User modified with ID: ${id}`)
        }
    )
}

const deleteFeedback = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('DELETE FROM feedbacks WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(`User deleted with ID: ${id}`)
    })
}

module.exports = {
    getFeedbacks,
    getFeedbackById,
    createFeedback,
    updateFeedback,
    deleteFeedback,
}