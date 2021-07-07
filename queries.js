import pg from 'pg';
import TelegramBot from 'node-telegram-bot-api'
import nodemailer from 'nodemailer';
import moment from 'moment'
import TeleBot from 'telebot'
import axios from "axios";

moment.locale('ru');

const Pool = pg.Pool
const pool = new Pool({
    user: 'hyhdsfgcsfgtko',
    host: 'ec2-54-229-68-88.eu-west-1.compute.amazonaws.com',
    database: 'dfjq5clee4ahv4',
    password: 'bf322de92e8333896e987ab29ee34ae0b57ffdd145ee11e91b825e6b6de530df',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    },
})

//--------------------------------------------------------------

const production_token = "1618943992:AAEWsKDdD9_VWvpcPHNjGFs8WpQBDJ93JbA";
const dev_token = "1782112572:AAFMbiHosVWH1TqKUXLmUUuiNV8q5Je0MPE";

const current_token = process.env.PORT === undefined ? dev_token : production_token;
//const bot = new TelegramBot(current_token, { polling: true })
const teleBot = new TeleBot(current_token);

teleBot.on('text', (msg) => msg.reply.text(msg.text));

teleBot.on(['/register'], (msg, match) => {
    const chatId = msg.chat.id
    const course_id = msg.text.split(' ').pop();
    console.log('User with username ' + msg.chat.username + ' registered with course id ' + course_id.toLowerCase());

    pool.query('INSERT INTO telegram_bot_users (chat_id, first_name, username, course_id) VALUES ($1, $2, $3, $4)', [msg.chat.id, msg.chat.first_name, msg.chat.username, course_id], (error, result) => {
        if (error) {
            throw error
        }
    })

    //users.push(chatId)
    teleBot.sendMessage(chatId, 'Done.')
})

const sendTelegramMessage = (chat_id, message) => {
    const token = "1618943992:AAEWsKDdD9_VWvpcPHNjGFs8WpQBDJ93JbA";
    chat_id = "567414370";
    //let url_req = "https://api.telegram.org/bot" + token + "/sendMessage" + "?chat_id=" + chat_id + "&text=" + message;
    let url_req = "https://api.telegram.org/bot" + token + "/sendMessage";
    let data = {
      chat_id: chat_id,
      text: message
    };
    console.log("res:");
    axios.post(url_req, data).then(res => console.log(res));
}

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
                    `Поздравляем с новым студентом вашего образовательного центра "${client.center_name}"!\n\nКурс: ${client.subcourse_title}\nРасписание: ${client.subcourse_schedule}\nФИО: ${client.fullname}\nТелефон: ${client.phone}\nEmail: ${client.email}\nОплаченная сумма: ${client.pay_sum}\nДата записи на курс: ${client.date}\nКод студента: ${client.code}\n`;
                teleBot.sendMessage(usersResult.rows[i]['chat_id'], message);
            }
        })
    })
}

const sendCallRequestNotification = (client) => {
    pool.query('SELECT * FROM telegram_bot_users WHERE course_id = 0', [], (error, usersResult) => {
        if (error) {
            throw error
        }
        for(let i = 0; i < usersResult.rows.length; i++){
            let message =
                `Новый запрос на обратный звонок!\nТелефон: ${client.phone}\nВремя: ${client.currentDate}`;
            teleBot.sendMessage(usersResult.rows[i]['chat_id'], message);
        }
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
            teleBot.sendMessage(usersResult.rows[i]['chat_id'], message);
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
    const { fullname, subcourse_id, email, date, phone, pay_sum, payment_reference_id, paid, promocode } = request.body

    pool.query('INSERT INTO clients (fullname, subcourse_id, email, date, phone, pay_sum, payment_reference_id, paid, promocode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [fullname, subcourse_id, email,  date, phone, pay_sum, payment_reference_id, paid, promocode], (error, result) => {
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

const setClientStatusOk = (reference_id, code) => {
    console.log("USER WITH REFERENCE ID " + reference_id + " PAY");
    pool.query(
        'UPDATE clients SET paid=true, code=$1 WHERE payment_reference_id=$2',
        [code, reference_id],
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

    pool.query('SELECT * FROM subcourses join courses on subcourses.course_id = courses.id WHERE course_id = $1', [courseId], (error, results) => {
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
    const { title, website_url, addresses, phones, login, password, city_id } = request.body

    pool.query('INSERT INTO courses (title, website_url, addresses, phones, login, password, city_id) VALUES ($1, $2, $3, $4, $5, $6, $7)', [title, website_url, addresses, phones, login, password, Number(city_id)], (error, result) => {
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

    pool.query('SELECT * FROM teachers where course_id = $1 and approved=true', [id], (error, results) => {
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

const getCourseCards = (request, response) => {
    pool.query('SELECT subcourses.id, subcourses.isonline, subcourses.title, courses.website_url, subcourses.currency, subcourses.unit_of_time, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, courses.id as "course_id", courses.title as "course_title", courses.phones, courses.instagram, courses.latitude, courses.longitude, courses.url, courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id where subcourses.approved=true order by order_coefficient desc', [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getCourseCardById = (request, response) => {
    const subcourseId = parseInt(request.params.subcourseId)

    pool.query('SELECT subcourses.id, subcourses.isonline, courses.website_url, subcourses.currency, subcourses.unit_of_time, subcourses.title, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, courses.id as "course_id", courses.title as "course_title", courses.phones, courses.instagram, courses.latitude, courses.longitude, courses.url, courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id where subcourses.id=$1 order by subcourses.title', [subcourseId], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getCourseCardsByCategoryId = (request, response) => {
    const categoryId = parseInt(request.params.categoryId)

    if(categoryId === 0){
        pool.query('SELECT subcourses.id, subcourses.title, subcourses.currency, subcourses.unit_of_time, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, courses.id as "course_id", courses.title as "course_title", courses.instagram, courses.latitude, courses.longitude, courses.url, courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id where subcourses.approved=true', [], (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).json(results.rows)
        })
    }else{
        pool.query('SELECT subcourses.id, subcourses.title, subcourses.currency, subcourses.unit_of_time, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, courses.id as "course_id", courses.title as "course_title", courses.instagram, courses.latitude, courses.longitude, courses.url, courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id where subcourses.category_id = $1 and subcourses.approved=true order by order_coefficient desc', [categoryId], (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).json(results.rows)
        })
    }
}

//---------------------------------------------------------------------------------

const writeTelegramMessage = (request, response) => {
    const { receiver_chat_id, student } = request.body
    teleBot.sendMessage(receiver_chat_id, `Hello`)
}

const handlePayment = (request, response) => {
    handlePaymentPost(request, response);
}

const sendEmailByReferenceId = (reference_id, verificationCode) => {
    pool.query('SELECT clients.id, clients.fullname, clients.subcourse_id, clients.date, clients.phone, clients.email, clients.pay_sum, clients.payment_reference_id, clients.paid, subcourses.id as "subcourse_id", subcourses.title as "subcourse_title", subcourses.schedule, subcourses.description, courses.email as "course_email", courses.title as "course_title" FROM clients inner join subcourses on clients.subcourse_id = subcourses.id inner join courses on subcourses.course_id = courses.id where payment_reference_id=$1', [reference_id], async (error, results) => {
        if (error) {
            throw error
        }
        let clientEmail = results.rows[0]['email'];
        let clientFullname = results.rows[0]['fullname'];
        let clientPhone = results.rows[0]['phone'];
        let clientPaySum = results.rows[0]['pay_sum'];
        let subcourseId = results.rows[0]['subcourse_id'];
        let subcourseTitle = results.rows[0]['subcourse_title'];
        let subcourseSchedule = results.rows[0]['schedule'];
        let subcourseDescription = results.rows[0]['description'];
        let centerName = results.rows[0]['course_title'];
        let centerEmail = results.rows[0]['course_email'];

        sendClientInfoNotification(subcourseId, {
            center_name: centerName,
            subcourse_title: subcourseTitle,
            fullname: clientFullname,
            email: clientEmail,
            phone: clientPhone,
            pay_sum: clientPaySum,
            subcourse_schedule: subcourseSchedule,
            code: verificationCode,
            date: moment().add(4, 'hours').format('LLL')
        });

        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'oilanedu@gmail.com',
                pass: 'dyvldkxooosevhon'
            }
        });


        let mailTextForClient = `
            Уважаемый(-ая) ${clientFullname}, благодарим вас за то, что записались на курс от образовательного центра ${centerName} через Oilan!


            Ваш код студента: ${verificationCode}.
            
            Укажите данный код у ресепшена ${centerName}, чтобы подтвердить, что вы уже купили курс.
            
            
            Курс, на который вы записались: ${subcourseTitle}.
            
            Описание курса: ${subcourseDescription}.
            
            Расписание: ${subcourseSchedule}.
            
            Образовательный центр: ${centerName}.
            
            
            Желаем вам удачи в обучении!
            
            С уважением, команда Oilan.
            
            
            Если возникли вопросы, можете позвонить по номеру: +7 (708) 800-71-77
            Или написать письмо по адресу: oilanedu@gmail.com
        `;

        let mailTextForCenter = `
            Уважаемые ${centerName}, к вам только что записался новый студент на пробный урок!

            Код студента: ${verificationCode}.
            
            Курс, на который записались: ${subcourseTitle}.
            
            Описание курса: ${subcourseDescription}.
            
            Расписание: ${subcourseSchedule}.  
            
            
            
            Данные о студенте:
            
            ФИО: ${clientFullname}.
            Номер телефона: ${clientPhone}.
            Email: ${clientEmail}.
        
            Свяжитесь с вашим новым студентом, и обсудите детали курса :)
            
            
            Желаем вам плодотворной работы!
            С уважением, команда Oilan.
            
            
            Если возникли вопросы, можете позвонить по номеру: +7 (708) 800-71-77
            Или написать письмо по адресу: oilanedu@gmail.com
        `;

        let mailOptionsForClient = {
            from: 'oilanedu@gmail.com',
            to: clientEmail,
            subject: 'Вы записались на курс!',
            text: mailTextForClient,
            // html:
            //     `
            //         <body>
            //             <h1>html test</h1>
            //         </body>
            //     `
        };

        let mailOptionsForCenter = {
            from: 'oilanedu@gmail.com',
            to: centerEmail,
            subject: 'У вас новый клиент!',
            text: mailTextForCenter,
            // html:
            //     `
            //         <body>
            //             <h1>html test</h1>
            //         </body>
            //     `
        };

        await transporter.sendMail(mailOptionsForClient, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        await transporter.sendMail(mailOptionsForCenter, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    })
}

const sendEmailByEmail = (studentData, verificationCode) => {
    pool.query('SELECT subcourses.id, subcourses.course_id, subcourses.title as "subcourse_title", courses.title as "course_title", courses.email as "course_email", subcourses.description, subcourses.price, subcourses.schedule, subcourses.duration, subcourses.rating, subcourses.category_id, subcourses.ages, subcourses.format, subcourses.expected_result, subcourses.start_requirements, subcourses.type, subcourses.isonline FROM subcourses JOIN courses ON subcourses.course_id = courses.id WHERE subcourses.id = $1', [studentData.subcourse_id], async (error, results) => {
        if (error) {
            throw error
        }
        let clientEmail = studentData['email'];
        let clientFullname = studentData['fullname'];
        let clientPhone = studentData['phone'];
        let clientPaySum = studentData['pay_sum'];
        let clientPromocode = studentData['promocode'];
        let subcourseId = studentData['subcourse_id'];
        let subcourseTitle = results.rows[0]['subcourse_title'];
        let subcourseSchedule = results.rows[0]['schedule'];
        let subcourseDescription = results.rows[0]['description'];
        let centerName = results.rows[0]['course_title'];
        let centerEmail = results.rows[0]['course_email'];

        sendClientInfoNotification(subcourseId, {
            center_name: centerName,
            subcourse_title: subcourseTitle,
            fullname: clientFullname,
            email: clientEmail,
            phone: clientPhone,
            pay_sum: clientPaySum,
            subcourse_schedule: subcourseSchedule,
            code: verificationCode,
            date: moment().add(4, 'hours').format('LLL')
        });

        let transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'oilanedu@gmail.com',
                pass: 'dyvldkxooosevhon'
            }
        });


        let mailTextForClient = `
        Уважаемый(-ая) ${clientFullname}, благодарим вас за то, что записались на курс от образовательного центра ${centerName} через Oilan!


        Ваш код студента: ${verificationCode}.
        
        Укажите данный код у ресепшена ${centerName}, чтобы подтвердить, что вы уже купили курс.
        
        
        Курс, на который вы записались: ${subcourseTitle}.
        
        Описание курса: ${subcourseDescription}.
        
        Расписание: ${subcourseSchedule}.
        
        Образовательный центр: ${centerName}.
        
        
        Желаем вам удачи в обучении!
        
        С уважением, команда Oilan.
        
        
        Если возникли вопросы, можете позвонить по номеру: +7 (708) 800-71-77
        Или написать письмо по адресу: oilanedu@gmail.com
        `;

        let mailTextForCenter = `
        Уважаемые ${centerName}, к вам только что записался новый студент на пробный урок!

        Код студента: ${verificationCode}.
        
        Курс, на который записались: ${subcourseTitle}.
        
        Описание курса: ${subcourseDescription}.
        
        Расписание: ${subcourseSchedule}.  
        
        

        Данные о студенте:
        
        ФИО: ${clientFullname}.
        Номер телефона: ${clientPhone}.
        Email: ${clientEmail}.
        Введенный промокод: ${clientPromocode}.
    
        Свяжитесь с вашим новым студентом, и обсудите детали курса :)
        
        
        Желаем вам плодотворной работы!
        С уважением, команда Oilan.
        
        
        Если возникли вопросы, можете позвонить по номеру: +7 (708) 800-71-77
        Или написать письмо по адресу: oilanedu@gmail.com
        `;

        let mailOptionsForClient = {
            from: 'oilanedu@gmail.com',
            to: clientEmail,
            subject: 'Вы записались на курс!',
            text: mailTextForClient,
            // html:
            //     `
            //         <body>
            //             <h1>html test</h1>
            //         </body>
            //     `
        };

        let mailOptionsForCenter = {
            from: 'oilanedu@gmail.com',
            to: centerEmail,
            subject: 'У вас новый клиент!',
            text: mailTextForCenter,
            // html:
            //     `
            //         <body>
            //             <h1>html test</h1>
            //         </body>
            //     `
        };

        await transporter.sendMail(mailOptionsForClient, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        await transporter.sendMail(mailOptionsForCenter, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    })
}

const handlePaymentPost = (request, response) => {
    console.log("handle payment POST:");

    //bot.sendMessage(receiver_chat_id, `Hello`)

    if(request.body.status === 1){
        let verificationCode = (Math.floor(Math.random() * 999999) + 100000).toString();
        let reference_id = request.body.reference_id;
        setClientStatusOk(reference_id, verificationCode);
        sendEmail(reference_id, verificationCode);

        response.redirect('https://www.oilan.io');
    } else{
        response.redirect('https://www.oilan.io/');
    }
}

const handleNewStudent = (request, response) => {
    let studentData = request.body;
    let verificationCode = (Math.floor(Math.random() * 999999) + 100000).toString();
    sendEmailByEmail(studentData, verificationCode);
}

//----------------------------------------------------------

const createCallRequest = (request, response) => {
    const { phone } = request.body;
    let currentDate = moment().format();

    sendCallRequestNotification({phone: phone, currentDate: moment().format('LLLL')});

    pool.query('INSERT INTO call_requests (phone, date) VALUES ($1, $2)', [phone, currentDate], (error, result) => {
        if (error) {
            throw error
        }
        response.status(201).send(`call_requests created`)
    })
}

//----------------------------------------------------------

const courseCardsFilter = (request, response) => {
    const { city, direction, price, center, isOnline } = request.body;

    let whereAdded = false;

    let queryText = "SELECT subcourses.id, subcourses.title, subcourses.currency, subcourses.unit_of_time, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, courses.id as \"course_id\", courses.title as \"course_title\", courses.url, courses.phones, courses.instagram, courses.latitude, courses.longitude, courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id";

    if(city !== 0){
        whereAdded = true;
        queryText += " where courses.city_id=" + city;
    }

    if(direction !== 0){
        if(whereAdded){
            queryText += " and ";
        }else{
            whereAdded = true;
            queryText += " where ";
        }

        queryText += "subcourses.category_id=" + direction;
    }

    if(center !== 0){
        if(whereAdded){
            queryText += " and ";
        }else{
            queryText += " where ";
        }

        queryText += "subcourses.course_id=" + center;
    }

    if(price !== "0"){
        if(whereAdded){
            queryText += " and ";
        }else{
            whereAdded = true;
            queryText += " where ";
        }

        switch(price){
            case "0-20000":
                queryText += "(subcourses.price >= 0 and subcourses.price <= 20000)";
                break;
            case "20000-40000":
                queryText += "(subcourses.price >= 20000 and subcourses.price <= 40000)";
                break;
            case "40000-60000":
                queryText += "(subcourses.price >= 40000 and subcourses.price <= 60000)";
                break;
            case "60000-80000":
                queryText += "(subcourses.price >= 60000 and subcourses.price <= 80000)";
                break;
            case "80000-100000":
                queryText += "(subcourses.price >= 80000 and subcourses.price <= 100000)";
                break;
            case "100000":
                queryText += "subcourses.price >= 100000";
                break;
        }
    }

    if(isOnline !== "0"){
        if(whereAdded){
            queryText += " and ";
        }else{
            whereAdded = true;
            queryText += " where ";
        }

        if(isOnline === "1"){
            queryText += "subcourses.isOnline=true";
        }else{
            queryText += "subcourses.isOnline=false";
        }
    }


    console.log("QUERY TEXT: " + queryText);

    pool.query(queryText, [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows);
    })
}

//----------------------------------------------------------
teleBot.start();
//----------------------------------------------------------

const logUserClick = (request, response) => {
    const { datetime, courseTitle, subcourseTitle, eventName } = request.body

    pool.query('INSERT INTO clicks_log (datetime, courseTitle, subcourseTitle, eventName) VALUES ($1, $2, $3, $4)', [datetime, courseTitle, subcourseTitle, eventName], (error, result) => {
        if (error) {
            throw error
        }
        response.status(201).send(`Click log: ${eventName}`)
    })
}

//----------------------------------------------------------

const login = (request, response) => {
    console.log("login handler");
    const { login, password } = request.body
    let userFound = false;
    pool.query('SELECT id from courses where login=$1 and password=$2', [login, password], (error, results) => {
        if (error) {
            throw error
        }
        if(results.rows[0] !== undefined){
            response.status(200).send(results.rows[0]);
        }
        else{
            response.sendStatus(401)
        }
    })
}

//----------------------------------------------------------

const getCabinetInfo = (request, response) => {
    console.log("getCabinetInfo handler");
    const id = parseInt(request.params.id)

    pool.query('SELECT id from courses where login=$1 and password=$2', [login, password], (error, results) => {
        if (error) {
            throw error
        }
        if(results.rows[0] !== undefined){
            response.status(200).send(results.rows[0]);
        }
        else{
            response.sendStatus(401)
        }
    })
}

//----------------------------------------------------------

const getAdminCards = (request, response) => {
    pool.query('SELECT subcourses.id, subcourses.isonline, subcourses.title, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, courses.id as "course_id", courses.title as "course_title", courses.phones, courses.instagram, courses.latitude, courses.longitude, courses.url, courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id where approved=false and declined=false', [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getAdminTeachers = (request, response) => {
    pool.query('SELECT * FROM teachers where approved=false and declined=false', (error, results) => {
        if (error) {
            throw error
        }
        console.log('partnership_requests sent');
        response.status(200).json(results.rows)
    })
}

//------------------------------------------------------------------

const approveCard = (request, response) => {
    const { cardId } = request.body
    pool.query(
        'UPDATE subcourses SET approved = true, declined = false WHERE id = $1',
        [cardId],
        (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).send(`Card modified with ID: ${cardId}`)
        }
    )
}

const declineCard = (request, response) => {
    const { cardId } = request.body
    pool.query(
        'UPDATE subcourses SET approved = false, declined = true WHERE id = $1',
        [cardId],
        (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).send(`Card modified with ID: ${cardId}`)
        }
    )
}

const approveTeacher = (request, response) => {
    const { cardId } = request.body
    pool.query(
        'UPDATE teachers SET approved = true, declined = false WHERE id = $1',
        [cardId],
        (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).send(`teacher modified with ID: ${cardId}`)
        }
    )
}

const declineTeacher = (request, response) => {
    const { cardId } = request.body
    pool.query(
        'UPDATE teachers SET approved = false, declined = true WHERE id = $1',
        [cardId],
        (error, results) => {
            if (error) {
                throw error
            }
            response.status(200).send(`teacher modified with ID: ${cardId}`)
        }
    )
}

//---------------------------------------------------------------------------

const getCabinetCourseCards = (request, response) => {
    const { courseId } = request.body
    pool.query('SELECT subcourses.id, course_categories.name as "category_name", subcourses.isonline, subcourses.title, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, courses.id as "course_id", courses.title as "course_title", courses.phones, courses.instagram, courses.latitude, courses.longitude, courses.url, courses.img_src, courses.background_image_url  from subcourses join courses on subcourses.course_id = courses.id join course_categories on subcourses.category_id = course_categories.id where subcourses.course_id=$1 and subcourses.approved=true', [courseId], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

//---------------------------------------------------------------

const createCourseCard = (request, response) => {
    const {
        courseId,
        title,
        description,
        expectedResult,
        startRequirements,
        duration,
        ages,
        type,
        isonline,
        price,
        currency,
        unitOfTime,
        schedule,
        categoryId
    } = request.body

    pool.query('INSERT INTO subcourses (course_id, title, description, price, schedule, duration, ages, expected_result, start_requirements, type, isonline, approved, declined, currency, unit_of_time, category_id, format) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)', [courseId, title, description, price, schedule, duration, ages, expectedResult, startRequirements, type, isonline === "true", false, false, currency, unitOfTime, categoryId, isonline === "true" ? "Online" : "Offline"], (error, result) => {
        if (error) {
            throw error
        }
        response.status(200).send(`Subcourse added with ID: ${result.insertId}`)
    })
}

const createCourseTeacher = (request, response) => {
    const {
        fullname,
        description,
        img_url,
        course_id
    } = request.body

    pool.query('INSERT INTO teachers (fullname, description, img_url, course_id, approved, declined) VALUES ($1, $2, $3, $4, $5, $6)', [fullname, description, img_url, course_id, false, false], (error, result) => {
        if (error) {
            throw error
        }
        response.status(201).send(`teacher added with ID: ${result.id}`)
    })
}

const getCabinetCourseTeachers = (request, response) => {
    const { courseId } = request.body
    pool.query('SELECT * FROM teachers where course_id=$1 and approved=true', [ courseId ],  (error, results) => {
        if (error) {
            throw error
        }
        console.log('partnership_requests sent');
        response.status(200).json(results.rows)
    })
}

const getFilters = (request, response) => {
    let filtersArray = [];
    pool.query('SELECT * FROM cities',  (error, citiesResult) => {
        if (error) {
            throw error
        }
        pool.query('SELECT * FROM course_categories',  (error, categoriesResult) => {
            if (error) {
                throw error
            }
            pool.query('SELECT * FROM courses',  (error, coursesResult) => {
                if (error) {
                    throw error
                }
                filtersArray.push(citiesResult.rows);
                filtersArray.push(categoriesResult.rows);
                filtersArray.push(coursesResult.rows);

                response.status(200).json(filtersArray)
            })
        })
    })
}

//--------------------------------------------------------

const registerTelegramUser = (request, response) => {
    const { code, chat_id } = request.body;
    const responseMessage = `Сервер принял code=${code}, chat_id=${chat_id}`;
    sendTelegramMessage(chat_id, "lolo");
    response.status(200).send(responseMessage);
}

const getCourseCategories = (request, response) => {
    console.log("getCouseCategories handler");
    pool.query('SELECT * FROM course_categories',  (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

export default {
    getCourseCategories,
    registerTelegramUser,
    getFilters,
    createCourseTeacher,
    getCabinetCourseTeachers,
    createCourseCard,
    getCabinetCourseCards,
    approveTeacher,
    declineTeacher,
    approveCard,
    declineCard,
    getAdminCards,
    getAdminTeachers,
    getCabinetInfo,
    login,
    handleNewStudent,
    logUserClick,
    courseCardsFilter,
    createCallRequest,
    getCourseCards,
    getCourseCardById,
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
