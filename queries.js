const Pool = require('pg').Pool
const pool = new Pool({
    user: 'vtzjzyuoxjxcmf',
    host: 'ec2-34-254-69-72.eu-west-1.compute.amazonaws.com',
    database: 'ddp94go37gmq7f',
    password: 'd7f7fa275027b4bfde6bc7d4b0b51b3278a4707cc4629a85a7fe277c3af53b0b',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    },
})

//--------------------------------------------------------------

const TelegramBot = require('node-telegram-bot-api')
const token = '1618943992:AAGosyGSk6CN_oFUGsEEIFUtGzSQpNh9f34'
const bot = new TelegramBot(token, { polling: true })

bot.onText(/\/register/, (msg, match) => {
    const chatId = msg.chat.id
    const course_id = msg.text.split(' ').pop();
    console.log('User with username ' + msg.chat.username + ' registered with course id ' + course_id.toLowerCase());

    pool.query('INSERT INTO telegram_bot_users (chat_id, first_name, username, course_id) VALUES ($1, $2, $3, $4)', [msg.chat.id, msg.chat.first_name, msg.chat.username, course_id], (error, result) => {
        if (error) {
            throw error
        }
    })

    //users.push(chatId)
    bot.sendMessage(chatId, 'Done.')
})

const sendClientInfoNotification = (subcourse_id, client) => {
    pool.query('SELECT * FROM subcourses WHERE id = $1', [subcourse_id], (error, subcoursesResults) => {
        if (error) {
            throw error
        }

        const course_id = subcoursesResults.rows[0]['course_id'];

        pool.query('SELECT * FROM telegram_bot_users WHERE course_id = $1', [course_id], (error, coursesResults) => {
            if (error) {
                throw error
            }
            for(let i = 0; i < coursesResults.rows.length; i++){
                let message =
                    `Поздравляем с новым студентом вашего образовательного центра!\n\nФИО: ${client.fullname}\nТелефон: ${client.phone}\nОплаченная сумма: ${client.pay_sum}\nДата записи на курс: ${client.date}\n`;
                bot.sendMessage(coursesResults.rows[i]['chat_id'], message);
            }
        })
    })
}

//------------------------------------------------------------

const getClients = (request, response) => {
    pool.query('SELECT * FROM clients', (error, results) => {
        if (error) {
            throw error
        }
        console.log('clients sent');
        response.status(200).json(results.rows)
    })
}

const getClientById = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('SELECT * FROM clients WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const createClient = (request, response) => {
    const { fullname, subcourse_id, date, phone, pay_sum } = request.body

    sendClientInfoNotification(subcourse_id, {
        fullname: fullname,
        phone: phone,
        pay_sum: pay_sum,
        date: date
    });

    pool.query('INSERT INTO clients (fullname, subcourse_id, date, phone, pay_sum) VALUES ($1, $2, $3, $4, $5)', [fullname, subcourse_id, date, phone, pay_sum], (error, result) => {
        if (error) {
            throw error
        }
        response.status(201).send(`Client added with ID: ${result.insertId}`)
    })


}

const updateClient = (request, response) => {
    const id = parseInt(request.params.id)
    const { fullname, subcourse_id, date, phone } = request.body

    pool.query(
        'UPDATE clients SET fullname = $1, subcourse_id = $2, date = $3, phone = $4 WHERE id = $5',
        [fullname, subcourse_id, date, phone, id],
        (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).send(`User modified with ID: ${id}`)
        }
    )
}

const deleteClient = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('DELETE FROM clients WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(`User deleted with ID: ${id}`)
    })
}

//---------------------------------------------------------------------------------

const getSubcourses = (request, response) => {
    pool.query('SELECT * FROM subcourses', (error, results) => {
        if (error) {
            throw error
        }
        console.log('subcourses sent');
        response.status(200).json(results.rows)
    })
}

const getSubcourseById = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('SELECT * FROM subcourses WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const createSubcourse = (request, response) => {
    const { course_id, title, description, price } = request.body

    pool.query('INSERT INTO subcourses (course_id, title, description, price) VALUES ($1, $2, $3, $4)', [course_id, title, description, price], (error, result) => {
        if (error) {
            throw error
        }
        response.status(201).send(`Subcourse added with ID: ${result.insertId}`)
    })
}

const updateSubcourse = (request, response) => {
    const id = parseInt(request.params.id)
    const { course_id, title, description, price } = request.body

    pool.query(
        'UPDATE subcourses SET course_id = $1, title = $2, description = $3, price = $4 WHERE id = $5',
        [course_id, title, description, price, id],
        (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).send(`Subcourse modified with ID: ${id}`)
        }
    )
}

const deleteSubcourse = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('DELETE FROM subcourses WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(`subcourse deleted with ID: ${id}`)
    })
}

//---------------------------------------------------------------------------------

const getCourses = (request, response) => {
    pool.query('SELECT * FROM courses', (error, results) => {
        if (error) {
            throw error
        }
        console.log('courses sent');
        response.status(200).json(results.rows)
    })
}

const getCourseById = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('SELECT * FROM courses WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const createCourse = (request, response) => {
    const { title, img_src, rating, subtitle, website_url, addresses, phones, description } = request.body

    pool.query('INSERT INTO courses (title, img_src, rating, subtitle, website_url, addresses, phones, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [title, img_src, rating, subtitle, website_url, addresses, phones, description], (error, result) => {
        if (error) {
            throw error
        }
        response.status(201).send(`course added with ID: ${result.insertId}`)
    })
}

const updateCourse = (request, response) => {
    const id = parseInt(request.params.id)
    const { title, img_src, rating, subtitle, website_url, addresses, phones, description } = request.body

    pool.query(
        'UPDATE courses SET title = $1, img_src = $2, rating = $3, subtitle = $4, website_url = $1, addresses = $2, phones = $3, description = $4 WHERE id = $5',
        [title, img_src, rating, subtitle, website_url, addresses, phones, description, id],
        (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).send(`Course modified with ID: ${id}`)
        }
    )
}

const deleteCourse = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('DELETE FROM courses WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(`course deleted with ID: ${id}`)
    })
}

//---------------------------------------------------------------------------------

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

const writeTelegramMessage = (request, response) => {
    const { receiver_chat_id, student } = request.body
    bot.sendMessage(receiver_chat_id, `Hello`)
}

module.exports = {
    getFeedbacks,
    getFeedbackById,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    getSubcourses,
    getSubcourseById,
    createSubcourse,
    updateSubcourse,
    deleteSubcourse,
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
}
