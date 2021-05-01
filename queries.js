const Pool = require('pg').Pool
const pool = new Pool({
    user: 'qmnhjuaubjeicc',
    host: 'ec2-54-74-156-137.eu-west-1.compute.amazonaws.com',
    database: 'dbsn7oc14hgi3f',
    password: '34e6ac10fde5da522cfb1089dd651b74c498cc3da5c13b4930bbe03bc6297f95',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    },
})

//--------------------------------------------------------------

const production_token = "1618943992:AAEWsKDdD9_VWvpcPHNjGFs8WpQBDJ93JbA";
const dev_token = "1782112572:AAFMbiHosVWH1TqKUXLmUUuiNV8q5Je0MPE";

const current_token = process.env.PORT === undefined ? dev_token : production_token;

const TelegramBot = require('node-telegram-bot-api')

const bot = new TelegramBot(current_token, { polling: true })

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

        pool.query('SELECT * FROM telegram_bot_users WHERE course_id = $1 or course_id = 0', [course_id], (error, usersResult) => {
            if (error) {
                throw error
            }
            console.log("Users count: " + usersResult.rows.length);
            for(let i = 0; i < usersResult.rows.length; i++){
                let message =
                    `Поздравляем с новым студентом вашего образовательного центра!\n\nФИО: ${client.fullname}\nТелефон: ${client.phone}\nОплаченная сумма: ${client.pay_sum}\nДата записи на курс: ${client.date}\n`;
                bot.sendMessage(usersResult.rows[i]['chat_id'], message);
            }
        })
    })
}

const sendPartnershipRequestNotification = (partner) => {
    pool.query('SELECT * FROM telegram_bot_users WHERE course_id = 0', [], (error, usersResult) => {
        if (error) {
            throw error
        }
        for(let i = 0; i < usersResult.rows.length; i++){
            let message =
                `У вас новая заявка на сотрудничество!\n\nНазвание компании: ${partner.company_name}\nФИО: ${partner.fullname}\nТелефон: ${partner.phone}\nПочта: ${partner.email}\n`;
            bot.sendMessage(usersResult.rows[i]['chat_id'], message);
        }
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
    const { fullname, subcourse_id, date, phone, pay_sum, payment_reference_id, paid } = request.body

    sendClientInfoNotification(subcourse_id, {
        fullname: fullname,
        phone: phone,
        pay_sum: pay_sum,
        date: date
    });

    pool.query('INSERT INTO clients (fullname, subcourse_id, date, phone, pay_sum, payment_reference_id, paid) VALUES ($1, $2, $3, $4, $5, $6, $7)', [fullname, subcourse_id, date, phone, pay_sum, payment_reference_id, paid], (error, result) => {
        if (error) {
            console.log(error)
            throw error
        }
        response.status(201).send(`Client added with ID: ${result.id}`)
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

const setClientStatusOk = (reference_id) => {
    console.log("USER WITH REFERENCE ID " + reference_id + " PAY");
    pool.query(
        'UPDATE clients SET paid=true WHERE payment_reference_id=$1',
        [reference_id],
        (error, results) => {
            if (error) {
                throw error
            }
        }
    )
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

const getCourseSubcourses = (request, response) => {
    const courseId = parseInt(request.params.courseId)

    console.log("course id: " + courseId);

    pool.query('SELECT * FROM subcourses WHERE course_id = $1', [courseId], (error, results) => {
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
    pool.query('SELECT * FROM courses where title NOT IN (\'test\') order by rating desc', (error, results) => {
        if (error) {
            throw error
        }
        console.log('courses sent');
        response.status(200).json(results.rows)
    })
}

const getCourseById = (request, response) => {
    const id = parseInt(request.params.id);
    console.log("course id: " + id);
    pool.query('SELECT * FROM courses WHERE id = $1 and title NOT IN (\'test\')', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getCoursesByCategory = (request, response) => {
    const categoryId = parseInt(request.params.id);
    console.log("category id: " + categoryId);
    pool.query('SELECT * FROM courses WHERE category_id = $1 and title NOT IN (\'test\')', [categoryId], (error, results) => {
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

//---------------------------------------------------------------------------------

const getPartnershipRequests = (request, response) => {
    pool.query('SELECT * FROM partnership_requests', (error, results) => {
        if (error) {
            throw error
        }
        console.log('partnership_requests sent');
        response.status(200).json(results.rows)
    })
}

const getPartnershipRequestById = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('SELECT * FROM partnership_requests WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const createPartnershipRequest = (request, response) => {
    const { company_name, fullname, email, phone } = request.body

    let partner = {
        company_name: company_name,
        fullname: fullname,
        email: email,
        phone: phone
    };

    sendPartnershipRequestNotification(partner);

    pool.query('INSERT INTO partnership_requests (company_name, fullname, email, phone) VALUES ($1, $2, $3, $4)', [company_name, fullname, email, phone], (error, result) => {
        if (error) {
            throw error
        }
        response.status(201).send(`partnership_requests added with ID: ${result.id}`)
    })
}

const updatePartnershipRequest = (request, response) => {
    const id = parseInt(request.params.id)
    const { company_name, fullname, email, phone } = request.body

    pool.query(
        'UPDATE partnership_requests SET company_name = $1, fullname = $2, email = $3, phone = $4 WHERE id = $5',
        [company_name, fullname, email, phone, id],
        (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).send(`partnership_requests modified with ID: ${id}`)
        }
    )
}

const deletePartnershipRequest = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('DELETE FROM partnership_requests WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(`partnership_requests deleted with ID: ${id}`)
    })
}


//---------------------------------------------------------------------------------

const getTeachers = (request, response) => {
    pool.query('SELECT * FROM teachers', (error, results) => {
        if (error) {
            throw error
        }
        console.log('partnership_requests sent');
        response.status(200).json(results.rows)
    })
}

const getCourseTeachers = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('SELECT * FROM teachers where course_id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        console.log('partnership_requests sent');
        response.status(200).json(results.rows)
    })
}

const getTeacherById = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('SELECT * FROM teachers WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const createTeacher = (request, response) => {
    const { fullname, description, img_url, course_id } = request.body

    pool.query('INSERT INTO teachers (fullname, description, img_url, course_id) VALUES ($1, $2, $3, $4)', [fullname, description, img_url, course_id], (error, result) => {
        if (error) {
            throw error
        }
        response.status(201).send(`teacher added with ID: ${result.id}`)
    })
}

const updateTeacher = (request, response) => {
    const id = parseInt(request.params.id)
    const { fullname, description, img_url, course_id } = request.body

    pool.query(
        'UPDATE teachers SET fullname = $1, description = $2, img_url = $3, course_id = $4 WHERE id = $5',
        [fullname, description, img_url, course_id, id],
        (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).send(`teacher modified with ID: ${id}`)
        }
    )
}

const deleteTeacher = (request, response) => {
    const id = parseInt(request.params.id)

    pool.query('DELETE FROM teachers WHERE id = $1', [id], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).send(`teacher deleted with ID: ${id}`)
    })
}


//---------------------------------------------------------------------------------

const getCourseCardsByCategoryId = (request, response) => {
    const categoryId = parseInt(request.params.categoryId)

    pool.query('SELECT subcourses.id, subcourses.title, subcourses.description, subcourses.price, subcourses.schedule, subcourses.duration, subcourses.rating, courses.title as "course_title", courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id where subcourses.category_id = $1', [categoryId], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

//---------------------------------------------------------------------------------

const writeTelegramMessage = (request, response) => {
    const { receiver_chat_id, student } = request.body
    bot.sendMessage(receiver_chat_id, `Hello`)
}

const handlePayment = (request, response) => {
    handlePaymentPost(request, response);
}

const sendCodeToEmail = (reference_id) => {
    pool.query('SELECT * FROM clients WHERE id = $1', [reference_id], (error, results) => {
        if (error) {
            throw error
        }
        console.log("Client info: ");
        console.log(results.rows[0]);
    })
}

const handlePaymentPost = (request, response) => {
    console.log("handle payment POST:");

    //bot.sendMessage(receiver_chat_id, `Hello`)

    if(request.body.status === 1){
        console.log("request.body.status === 1");
        let reference_id = request.body.reference_id;
        setClientStatusOk(reference_id);
        sendCodeToEmail(reference_id);
        response.redirect('https://www.oilan.io');
    } else{
        response.redirect('https://www.oilan.io/courses');
    }
}

module.exports = {
    getCourseCardsByCategoryId,
    getFeedbacks,
    getFeedbackById,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    getCourses,
    getCourseById,
    getCoursesByCategory,
    createCourse,
    updateCourse,
    deleteCourse,
    getSubcourses,
    getSubcourseById,
    getCourseSubcourses,
    createSubcourse,
    updateSubcourse,
    deleteSubcourse,
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    getPartnershipRequests,
    getPartnershipRequestById,
    createPartnershipRequest,
    updatePartnershipRequest,
    deletePartnershipRequest,
    getTeachers,
    getCourseTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    handlePayment,
    handlePaymentPost
}
