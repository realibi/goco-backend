import pg from 'pg';
import nodemailer from 'nodemailer';
import moment from 'moment'
import axios from "axios";
import jwt from 'jsonwebtoken'
import {secret} from "./config.js"
import { v4 as uuidv4 } from 'uuid';

moment.locale('ru');

const devPoolOptions = {
    user: 'hyhdsfgcsfgtko',
    host: 'ec2-54-229-68-88.eu-west-1.compute.amazonaws.com',
    database: 'dfjq5clee4ahv4',
    password: 'bf322de92e8333896e987ab29ee34ae0b57ffdd145ee11e91b825e6b6de530df',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
};

const productionPoolOptions = {
    user: 'postgres',
    host: '91.201.215.148',
    database: 'oilan_db',
    password: 'root',
    port: 5432,
    ssl: false
};

const Pool = pg.Pool
const pool = new Pool(productionPoolOptions);

let stuffEmails = [
    'reallibi@gmail.com',
    // 'kakimadiya@gmail.com',
    // 'kakimadina2002@gmail.com',
    // 'zane.css34@gmail.com',
    // '205047@astanait.edu.kz',
    // 'd.dybyspayeva@gmail.com',
    // 'zhaksybaev0107@gmail.com',
    // 'munsnk@icloud.com',
    // 'azat.aliaskar@gmail.com'
]

//--------------------------------------------------------------

// const production_token = "1618943992:AAEWsKDdD9_VWvpcPHNjGFs8WpQBDJ93JbA";
// const dev_token = "1782112572:AAFMbiHosVWH1TqKUXLmUUuiNV8q5Je0MPE";

// const current_token = process.env.PORT === undefined ? dev_token : production_token;
// const bot = new TelegramBot(current_token, { polling: true })
// const teleBot = new TeleBot(current_token);

// teleBot.on('text', (msg) => msg.reply.text(msg.text));

// teleBot.on(['/register'], (msg, match) => {
//     const chatId = msg.chat.id
//     const course_id = msg.text.split(' ').pop();
//     console.log('User with username ' + msg.chat.username + ' registered with course id ' + course_id.toLowerCase());
//
//     pool.query('INSERT INTO telegram_bot_users (chat_id, first_name, username, course_id) VALUES ($1, $2, $3, $4)', [msg.chat.id, msg.chat.first_name, msg.chat.username, course_id], (error, result) => {
//         if (error) {
//             throw error
//         }
//     })
//
//     //users.push(chatId)
//     teleBot.sendMessage(chatId, 'Done.')
// })

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

        // pool.query('SELECT * FROM telegram_bot_users WHERE course_id = $1 or course_id = 0', [course_id], (error, usersResult) => {
        //     if (error) {
        //         throw error
        //     }
        //     console.log("Users count: " + usersResult.rows.length);
        //     for(let i = 0; i < usersResult.rows.length; i++){
        //         let message =
        //             `Поздравляем с новым студентом вашего образовательного центра "${client.center_name}"!\n\nКурс: ${client.subcourse_title}\nРасписание: ${client.subcourse_schedule}\nФИО: ${client.fullname}\nТелефон: ${client.phone}\nEmail: ${client.email}\nОплаченная сумма: ${client.pay_sum}\nДата записи на курс: ${client.date}\nКод студента: ${client.code}\n`;
        //         teleBot.sendMessage(usersResult.rows[i]['chat_id'], message);
        //     }
        // })
    })
}

const sendCallRequestNotification = (client) => {
    // pool.query('SELECT * FROM telegram_bot_users WHERE course_id = 0', [], (error, usersResult) => {
    //     if (error) {
    //         throw error
    //     }
    //     for(let i = 0; i < usersResult.rows.length; i++){
    //         let message =
    //             `Новый запрос на обратный звонок!\nТелефон: ${client.phone}\nВремя: ${client.currentDate}`;
    //         teleBot.sendMessage(usersResult.rows[i]['chat_id'], message);
    //     }
    // })
}

const sendPartnershipRequestNotification = (partner) => {
    // pool.query('SELECT * FROM telegram_bot_users WHERE course_id = 0', [], (error, usersResult) => {
    //     if (error) {
    //         throw error
    //     }
    //     for(let i = 0; i < usersResult.rows.length; i++){
    //         let message =
    //             `У вас новая заявка на сотрудничество!\n\nНазвание компании: ${partner.company_name}\nФИО: ${partner.fullname}\nТелефон: ${partner.phone}\nПочта: ${partner.email}\n`;
    //         teleBot.sendMessage(usersResult.rows[i]['chat_id'], message);
    //     }
    // })
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
    pool.query('SELECT * FROM subcourses order by order_coefficient desc', (error, results) => {
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

    pool.query('SELECT subcourses.id, course_id, subcourses.title as "title", courses.title as "course_title", courses.website_url, courses.instagram, courses.img_src, courses.background_image_url, courses.phones, courses.url, subcourses.description as "subcourse_description", price, schedule, duration, subcourses.rating as "subcourses_rating", category_id, ages, format, expected_result, start_requirements, type, isonline, approved, declined, currency, unit_of_time, order_coefficient, published_date, courses.id as "course_id" FROM subcourses join courses on subcourses.course_id = courses.id WHERE course_id = $1 and approved=true', [courseId], (error, results) => {
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
    const subcourseId = parseInt(request.params.subcourseId)
    pool.query('SELECT * FROM feedbacks where subcourse_id = $1 ORDER BY id DESC', [subcourseId], (error, results) => {
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

const getCurrentDate = (monthOffset = 0) => {
    let currentDate = new Date();

    let dd = currentDate.getDate();
    if(dd < 10) dd = '0' + dd;

    let mm = currentDate.getMonth() + monthOffset + 1;
    if(mm < 10) mm = '0' + mm;

    let yy = currentDate.getFullYear();

    return yy + "-" + mm + "-" + dd;
}

const createFeedback = (request, response) => {
    const { fullname, message, rating, subcourse_id } = request.body

    pool.query('INSERT INTO feedbacks (fullname, date, message, rating, subcourse_id) VALUES ($1, $2, $3, $4, $5)', [fullname, getCurrentDate(), message, rating, subcourse_id], (error, result) => {
        if (error) {
            throw error
        }
        response.status(201).send(`feedback added with ID: ${result.insertId}`)
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

    pool.query(`SELECT * FROM teachers where course_id = $1 and approved=true and fullname!='test'`, [id], (error, results) => {
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
    pool.query('SELECT subcourses.id, subcourses.isonline, subcourses.title, courses.website_url, subcourses.currency, subcourses.unit_of_time, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, courses.id as "course_id", courses.title as "course_title", courses.phones, courses.instagram, courses.latitude, courses.longitude, courses.url, courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id where subcourses.approved=true and subcourses.is_archived=false order by order_coefficient asc', [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getCourseCardById = (request, response) => {
    const subcourseId = parseInt(request.params.subcourseId)

    pool.query('SELECT subcourses.id, subcourses.isonline, courses.website_url, subcourses.currency, subcourses.unit_of_time, subcourses.title, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, courses.id as "course_id", courses.title as "course_title", courses.phones, courses.instagram, courses.latitude, courses.longitude, courses.url, courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id where subcourses.id=$1 and subcourses.approved=true order by subcourses.title', [subcourseId], (error, results) => {
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
    //teleBot.sendMessage(receiver_chat_id, `Hello`)
}

const handlePayment = (request, response) => {
    console.log("handlePayment get:");
    console.log(request.body);
    response.redirect('https://www.oilan.io/');
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

}

const handlePaymentPost = async (request, response) => {
    console.log("handle payment POST:");

    //bot.sendMessage(receiver_chat_id, `Hello`)

    console.log(request.body)

    if(request.body.status === 1){
        let paymentPayload = JSON.parse(request.body.description);
        let centerId = paymentPayload.centerId;
        let cardsCount = paymentPayload.cardsCount;
        let monthCount = Number(paymentPayload.monthCount);

        console.log("payment payload")
        console.log(paymentPayload)

        await pool.query(`UPDATE public.courses\n` +
                    `\tSET permitted_cards_count=${cardsCount}, \n` +
                    `\tlast_payment_date=current_date, \n` +
                    `\tnext_payment_date=current_date + interval \'${monthCount} month\'\n` +
                    `\tWHERE id=${centerId}`,
            async (error, results) => {
                if (error) {
                    throw error
                }

                pool.query('INSERT INTO center_account_notifications (center_id, message, checked, datetime) VALUES ($1, $2, $3, current_timestamp)',
                    [
                        centerId,
                        `Вы успешно продлили подписку для ${cardsCount} карточек на ${monthCount} месяцев!
                        Все ваши карточки были переведены в архив. Пожалуйста, активируйте заново нужные карточки.
                        Напоминаем, что вы можете активировать только ${cardsCount} карточек!`,
                        false],
                    (error, result) => {
                    if (error) {
                        throw error
                    }

                        pool.query(`select title from courses where id=${centerId}`,
                            (error, result) => {
                                if (error) {
                                    throw error
                                }
                                let centerTitle = result.rows[0].title;
                                let emailMessage = `Центр '${centerTitle}' купил подписку на ${monthCount} месяцев. Дата покупки: ${getCurrentDate()}`;
                                sendEmail(stuffEmails, `Oilan. Оплата подписки - ${centerTitle}.`, emailMessage);
                            })
                })
        })

        await pool.query(`update subcourses set is_archived=true where course_id=${centerId}`,
            (error, result) => {
                if (error) {
                    throw error
                }
        })
    }

    return response.redirect('https://www.oilan.io/cabinet');
}

const handleNewStudent = (request, response) => {
    let studentData = request.body;
    let verificationCode = (Math.floor(Math.random() * 999999) + 100000).toString();

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

        let emailNotificationMessage =`
        Название центра: ${centerName}.
        
        Курс, на который записались: ${subcourseTitle}.
        
        Описание курса: ${subcourseDescription}.
        
        Расписание: ${subcourseSchedule}.  
        
        

        Данные о студенте:
        
        ФИО: ${clientFullname}.
        Номер телефона: ${clientPhone}.
        Email: ${clientEmail}.
        Введенный промокод: ${clientPromocode}.
    
        Свяжитесь с вашим новым студентом, и обсудите детали курса :)
        `;

        await sendEmail(
            stuffEmails,
            'Новый студент!',
            emailNotificationMessage
        )
    })


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
    const { city, direction, price, center, isOnline, sortType} = request.body;

    console.log("sort type: " + sortType);

    let whereAdded = false;

    let queryText = "SELECT subcourses.id, subcourses.title, subcourses.currency, subcourses.unit_of_time, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, courses.id as \"course_id\", courses.title as \"course_title\", courses.url, courses.phones, courses.instagram, courses.website_url, courses.latitude, courses.longitude, courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id";

    if(city !== '0'){
        whereAdded = true;
        queryText += " where courses.city_id=" + city;
    }

    if(whereAdded){
        queryText += " and ";
    }else{
        whereAdded = true;
        queryText += " where ";
    }
    queryText += "subcourses.approved=true";

    if(direction !== '0'){
        if(whereAdded){
            queryText += " and ";
        }else{
            whereAdded = true;
            queryText += " where ";
        }

        queryText += "subcourses.category_id=" + direction;
    }

    if(center !== '0'){
        if(whereAdded){
            queryText += " and ";
        }else{
            queryText += " where ";
        }

        queryText += "subcourses.course_id=" + center;
    }

    if(price !== '0'){
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

    if(isOnline !== '0'){
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

    if(whereAdded){
        queryText += " and ";
    }else{
        whereAdded = true;
        queryText += " where ";
    }
    queryText += 'subcourses.is_archived=false'


    if(sortType !== "0"){
        queryText += ` order by ${sortType}`;
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
//teleBot.start();
//----------------------------------------------------------

const logUserClick = (request, response) => {
    const { datetime, courseTitle, courseId, subcourseTitle, eventName } = request.body

    pool.query('INSERT INTO clicks_log (datetime, courseTitle, subcourseTitle, eventName, course_id) VALUES ($1, $2, $3, $4, $5)', [datetime, courseTitle, subcourseTitle, eventName, courseId], (error, result) => {
        if (error) {
            throw error
        }
        //response.status(201).send('ok')
    })

    let viewsQuery = `select subcourses.views from subcourses where subcourses.id=${courseId}`;
    console.log(viewsQuery);

    pool.query(viewsQuery, (error, result) => {
        if (error) {
            throw error
        }
        let viewsCount = result.rows[0].views;
        if((viewsCount + 1) % 3 === 0){
            let maxOrderCoefficientQuery = `select max(order_coefficient) as "max" from subcourses`;
            console.log(maxOrderCoefficientQuery);
            pool.query(maxOrderCoefficientQuery, (error, orderResult) => {
                if (error) {
                    throw error
                }
                let maxOrderCoefficient = orderResult.rows[0].max;
                console.log('maxOrderCoefficient: ' + maxOrderCoefficient);

                let updateViewsAndOrderCoefficientQuery = `update subcourses set views=${viewsCount+1}, order_coefficient=${maxOrderCoefficient+0.1} where id=${courseId}`;
                console.log(updateViewsAndOrderCoefficientQuery);
                pool.query(updateViewsAndOrderCoefficientQuery, (error, updateResult) => {
                    if (error) {
                        throw error
                    }
                    response.status(200).json({event: `Click log: ${eventName}`, order_coefficient: maxOrderCoefficient+0.1});
                })
            })
        }else{
            let updateViewsAndOrderCoefficientQuery = `update subcourses set views=${viewsCount+1} where id=${courseId}`;
            console.log(updateViewsAndOrderCoefficientQuery);
            pool.query(updateViewsAndOrderCoefficientQuery, (error, updateResult) => {
                if (error) {
                    throw error
                }
                response.status(200).json({event: `Click log: ${eventName}`});
            })
        }
    })
}

//----------------------------------------------------------

const generateAccessToken = (userId, roleId, centerId) => {
    const payload = {
        userId,
        roleId,
        centerId
    }
    return jwt.sign(payload, secret, {expiresIn: "365d"} )
}

const login = (request, response) => {
    console.log("login handler");
    const { login, password } = request.body
    pool.query('SELECT * from users where login=$1 and password=$2', [login, password], (error, results) => {
        if (error) {
            throw error
        }
        if(results.rows[0] !== undefined){
            let user = results.rows[0];
            const token = generateAccessToken(user.id, user.role_id, user.center_id)
            return response.status(200).json({token, centerId: user.center_id, roleId: user.role_id, userId: user.id})
        }
        else{
            return response.status(400).json({message: `Пользователь ${login} не найден`})
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
    pool.query('SELECT subcourses.id, subcourses.isonline, subcourses.title, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, subcourses.currency, subcourses.unit_of_time, subcourses.approved, subcourses.declined, courses.id as "course_id", courses.title as "course_title", courses.phones, courses.instagram, courses.latitude, courses.longitude, courses.url, courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id where approved=false and declined=false', [], (error, results) => {
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
    pool.query(`SELECT subcourses.is_archived, subcourses.id, subcourses.category_id as "card_category_id", course_categories.name as "category_name", subcourses.isonline, subcourses.title, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, subcourses.approved, subcourses.declined, courses.id as "course_id", courses.title as "course_title", courses.phones, courses.instagram, courses.latitude, courses.longitude, courses.url, courses.img_src, courses.background_image_url, currency, unit_of_time, subcourses.rating, published_date from subcourses join courses on subcourses.course_id = courses.id join course_categories on subcourses.category_id = course_categories.id where subcourses.course_id=$1 and subcourses.title!='test' and subcourses.declined=false`, [courseId], (error, results) => {
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
    } = request.body;

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
    pool.query(`SELECT * FROM teachers where course_id=$1 and declined=false and teachers.fullname != 'test'`, [ courseId ],  (error, results) => {
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
                filtersArray.push(citiesResult.rows.sort(function ( a, b ) {
                    if ( a.name < b.name ){
                        return -1;
                    }
                    if ( a.name > b.name ){
                        return 1;
                    }
                    return 0;
                }));
                filtersArray.push(categoriesResult.rows.sort(function ( a, b ) {
                    if ( a.name < b.name ){
                        return -1;
                    }
                    if ( a.name > b.name ){
                        return 1;
                    }
                    return 0;
                }));
                filtersArray.push(coursesResult.rows.sort(function ( a, b ) {
                    if ( a.title < b.title ){
                        return -1;
                    }
                    if ( a.title > b.title ){
                        return 1;
                    }
                    return 0;
                }));

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

const sendEditCard = (request, response) => {
    const {
        id,
        course_id,
        title,
        description,
        price,
        schedule,
        duration,
        category_id,
        ages,
        format,
        expected_result,
        start_requirements,
        type,
        currency,
        unit_of_time
    } = request.body;

    pool.query('INSERT INTO editing_coursecards (subcourse_id, course_id, title, description, price, schedule, duration, category_id, ages, format, expected_result, start_requirements, type, isonline, currency, unit_of_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)', [id, course_id, title, description, price, schedule, duration, category_id, ages, format, expected_result, start_requirements, type, format === "Online", currency, unit_of_time], (error, result) => {
        if (error) {
            throw error
        }
        response.status(201).send(`editing_coursecards added with ID: ${result.id}`)
    })
}

const getEditCards = (request, response) => {
    pool.query('SELECT editing_coursecards.id as "edit_card_id", editing_coursecards.subcourse_id, editing_coursecards.title as "course_title", editing_coursecards.description, editing_coursecards.price, editing_coursecards.schedule, editing_coursecards.duration, editing_coursecards.rating, editing_coursecards.category_id, editing_coursecards.ages, editing_coursecards.format, editing_coursecards.expected_result, editing_coursecards.start_requirements, editing_coursecards.type, editing_coursecards.isonline, editing_coursecards.approved, editing_coursecards.declined, editing_coursecards.currency, editing_coursecards.unit_of_time, editing_coursecards.course_id, courses.img_src, courses.title, courses.website_url, courses.phones, courses.background_image_url, courses.instagram FROM editing_coursecards join courses on courses.id = editing_coursecards.course_id',  (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const getClickStatistics = (request, response) => {
    let { centerName } = request.body;

    pool.query('SELECT \n' +
        '\t(SELECT count(id)\n' +
        '\tFROM public.clicks_log\n' +
        '\tWHERE coursetitle=$1 and eventname=\'О курсе\') as "o_kurse",\n' +
        '\t(\n' +
        '\t\tSELECT \n' +
        '\t\t((SELECT count(id)\n' +
        '\t\tFROM public.clicks_log\n' +
        '\t\tWHERE coursetitle=$1 and eventname=\'Записаться\') +\n' +
        '\t\t(SELECT count(id)\n' +
        '\t\tFROM public.clicks_log\n' +
        '\t\tWHERE coursetitle=$1 and eventname=\'Отправить заявку\')) as "otpravit_zayavku"\n' +
        '\t),\n' +
        '\t(\n' +
        '\t\tSELECT \n' +
        '\t\t((SELECT count(id)\n' +
        '\t\tFROM public.clicks_log\n' +
        '\t\tWHERE coursetitle=$1 and eventname=\'Показать больше\') +\n' +
        '\t\t(SELECT count(id)\n' +
        '\t\tFROM public.clicks_log\n' +
        '\t\tWHERE coursetitle=$1 and eventname=\'Подробнее\')) as "pokazat_bolshe"\n' +
        '\t),\n' +
        '\t(SELECT count(id)\n' +
        '\tFROM public.clicks_log\n' +
        '\tWHERE coursetitle=$1 and eventname=\'Номер телефона\') as "nomer_telefona",\n' +
        '\t(SELECT count(id)\n' +
        '\tFROM public.clicks_log\n' +
        '\tWHERE coursetitle=$1 and eventname=\'Website\') as "website",\n' +
        '\t(SELECT count(id)\n' +
        '\tFROM public.clicks_log\n' +
        '\tWHERE coursetitle=$1 and eventname=\'Instagram\') as "instagram"\n' +
        '\t;', [centerName],  (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const cardCreationPermission = (request, response) => {
    const centerId = parseInt(request.params.centerId)

    pool.query(`select count(id) from subcourses where approved=true and is_archived=false and title!='test' and course_id=$1`, [centerId],  (error, results) => {
        if (error)  {
            throw error
        }
        let currentCountOfCards = results.rows[0].count;

        pool.query('select permitted_cards_count from courses where id=$1', [centerId],  (error, results) => {
            if (error) {
                throw error
            }
            let permittedCardsCount = results.rows[0].permitted_cards_count === null ? 0 : results.rows[0].permitted_cards_count;

            let permitted = false;

            if(currentCountOfCards < permittedCardsCount){
                permitted = true;
            }

            response.status(200).json({
                permittedCardsCount: permittedCardsCount,
                permitted: permitted
            });
        })
    })
}

//-----------------------------------------------------------------

const loadCallCenterInfo = (request, response) => {
    // let { rowStartNum, rowEndNum } = request.body;
    // rowStartNum = Number(rowStartNum);
    // rowEndNum = Number(rowEndNum);
    //let query = `SELECT id, center_category_id, call_center_user_id, center_name, contact_name, center_phone, center_email, to_char( first_call_date , 'YYYY-mm-dd') as "first_call_date", first_call_time, first_call_comment, to_char( kp_send_date , 'YYYY-mm-dd') as "kp_send_date", to_char( second_call_date , 'YYYY-mm-dd') as "second_call_date", second_call_time, second_call_comment, to_char( meeting_date , 'YYYY-mm-dd') as "meeting_date", meeting_time, saller_user_id, meeting_comitted, meeting_comment, will_conclude_contract, to_char( contract_signing_start_date , 'YYYY-mm-dd') as "contract_signing_start_date", to_char( data_collection_start_date , 'YYYY-mm-dd') as "data_collection_start_date", contract_send_status, contract_send_comment, contract_agreed, contract_agreement_comment, contract_signed, contract_signed_comment, to_char( contract_sign_date , 'YYYY-mm-dd') as "contract_sign_date", operation_personal_user_id  FROM public.crm  where center_name is not null ORDER BY id offset ${rowStartNum-1} rows FETCH NEXT ${rowEndNum-rowStartNum} ROWS ONLY`;
    let query = `SELECT id, center_category_id, call_center_user_id, center_name, contact_name, center_phone, center_email, to_char( first_call_date , 'YYYY-mm-dd') as "first_call_date", first_call_time, first_call_comment, to_char( kp_send_date , 'YYYY-mm-dd') as "kp_send_date", to_char( second_call_date , 'YYYY-mm-dd') as "second_call_date", second_call_time, second_call_comment, to_char( meeting_date , 'YYYY-mm-dd') as "meeting_date", meeting_time, saller_user_id, meeting_comitted, meeting_comment, will_conclude_contract, to_char( contract_signing_start_date , 'YYYY-mm-dd') as "contract_signing_start_date", to_char( data_collection_start_date , 'YYYY-mm-dd') as "data_collection_start_date", contract_send_status, contract_send_comment, contract_agreed, contract_agreement_comment, contract_signed, contract_signed_comment, to_char( contract_sign_date , 'YYYY-mm-dd') as "contract_sign_date", operation_personal_user_id  FROM public.crm  where center_name is not null ORDER BY id`;
    console.log(query);
    pool.query(query, (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json({rows: results.rows, length: results.rows.length});
    })
}

const loadSallerInfo = (request, response) => {
    pool.query('SELECT id, center_category_id, call_center_user_id, center_name, contact_name, center_phone, center_email, to_char( first_call_date , \'YYYY-mm-dd\') as "first_call_date", first_call_time, first_call_comment, to_char( kp_send_date , \'YYYY-mm-dd\') as "kp_send_date", to_char( second_call_date , \'YYYY-mm-dd\') as "second_call_date", second_call_time, second_call_comment, to_char( meeting_date , \'YYYY-mm-dd\') as "meeting_date", meeting_time, saller_user_id, meeting_comitted, meeting_comment, will_conclude_contract, to_char( contract_signing_start_date , \'YYYY-mm-dd\') as "contract_signing_start_date", to_char( data_collection_start_date , \'YYYY-mm-dd\') as "data_collection_start_date", contract_send_status, contract_send_comment, contract_agreed, contract_agreement_comment, contract_signed, contract_signed_comment, to_char( contract_sign_date , \'YYYY-mm-dd\') as "contract_sign_date", operation_personal_user_id FROM public.crm where meeting_date is not null', (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(results.rows);
    })
}

const updateCallCenterRow = (request, response) => {
    const {
        id,
        companyName,
        phone,
        contactPerson,
        mail,
        sendKPDate,
        firstCallComment,
        secondCallComment,
        meetingDate,
        meetingTime,
        firstCall,
        firstCallTime,
        secondCallTime,
        secondCall,
        categoryId,
        userId
    } = request.body;



    if (meetingDate !== null && meetingTime !== null) {

        let query = `SELECT count(id) FROM public.crm where meeting_date='${meetingDate}' and (time '${meetingTime}') - '01:00' < meeting_time and (time '${meetingTime}') + '1 hour' > meeting_time and id!=${id}`;
        console.log(query);

        pool.query(query, (error, results) => {
            if (error) {
                throw error
            }

            if(results.rows[0].count > 0){
                response.status(409).json(false);
                console.log("нельзя назначить встречу в это время");
            }else{
                console.log("update c указанием встречи");
                pool.query('UPDATE public.crm SET call_center_user_id=$16, center_name=$2, center_category_id=$15, contact_name=$4, center_phone=$3, center_email=$5, first_call_date=$11, first_call_time=$12, first_call_comment=$7, kp_send_date=$6, second_call_date=$14, second_call_time=$13, second_call_comment=$8, meeting_date=$9, meeting_time=$10 WHERE id=$1', [
                    id,
                    companyName,
                    phone,
                    contactPerson,
                    mail,
                    sendKPDate,
                    firstCallComment,
                    secondCallComment,
                    meetingDate === "" ? null : meetingDate,
                    meetingTime === "" ? null : meetingTime,
                    firstCall,
                    firstCallTime,
                    secondCallTime,
                    secondCall,
                    categoryId,
                    userId
                ], (error, results) => {
                    if (error) {
                        throw error
                    }

                    response.status(200).json(true);
                })
            }
        })
    } else {
        console.log("update без указания встречи");
        let query = `UPDATE public.crm SET call_center_user_id=${userId}, center_name='${companyName}', center_category_id=${categoryId}, contact_name='${contactPerson}', center_phone='${phone}', center_email='${mail}', first_call_date=${firstCall === null ? null : `'${firstCall}'`}, first_call_time=${firstCallTime === null ? null : `'${firstCallTime}'`}, first_call_comment='${firstCallComment}', kp_send_date=${sendKPDate === null ? null : `'${sendKPDate}'`}, second_call_date=${secondCall === null ? null : `'${secondCall}'`}, second_call_time=${secondCallTime === null ? null : `'${secondCallTime}'`}, second_call_comment='${secondCallComment}' WHERE id=${id}`;
        console.log(query)
        pool.query(query, (error, results) => {
            if (error) {
                throw error
            }

            response.status(200).json(true);
        })
    }
}

const callCenterAddCenter = (request, response) => {
    const {
        companyName,
        categoryId,
        phone,
        contactPerson,
        mail,
    } = request.body;

    pool.query('insert into crm(center_name, contact_name, center_phone, center_email, center_category_id) values($1, $2, $3, $4, $5)', [companyName, contactPerson, phone, mail, categoryId], (error, results) => {
        if (error) {
            throw error
        }

        response.status(200).json(true);
    })
}

const getCrmCourseCategories = (request, response) => {
    console.log("getCrmCourseCategories handler");
    pool.query('SELECT * FROM crm_course_categories',  (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const loadOperationPersonal1Info = (request, response) => {
    pool.query('SELECT * FROM crm where will_conclude_contract=true and contract_signing_start_date is not null',  (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const loadOperationPersonal2Info = (request, response) => {
    pool.query('SELECT * FROM crm where contract_sign_date is not null',  (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const loadOperationPersonal3Info = (request, response) => {
    pool.query('SELECT * FROM crm where placement_date is not null',  (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const updateSellerRow = (request, response) => {
    const {
        id,
        companyName,
        contactPerson,
        phone,
        mail,
        meetingDate,
        meetingTime,
        meetingComitted,
        meetingComment,
        contractStatus,
        contractConclusionDate,
        categoryId
    } = request.body;

    pool.query('update crm set center_name=$2, contact_name=$3, center_phone=$4, center_email=$5, meeting_date=$6, meeting_time=$7, meeting_comitted=$8, meeting_comment=$9, will_conclude_contract=$10, contract_signing_start_date=$11, center_category_id=$12 where id=$1', [
        id,
        companyName,
        contactPerson,
        phone,
        mail,
        meetingDate,
        meetingTime,
        meetingComitted,
        meetingComment,
        contractStatus,
        contractConclusionDate,
        categoryId
    ], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(true)
    })
}

const updateOperationPersonal1Row = (request, response) => {
    const {
        id,
        companyName,
        categoryId,
        contactPerson,
        phone,
        mail,
        infoCollectionDate,
        sendContractStatus,
        sendContractComments,
        contractAgreedStatus,
        contractAgreedComments,
        contractSignedStatus,
        contractSignedComments,
        contractSignedDate,
    } = request.body;

    pool.query('update crm set center_name=$2, center_category_id=$3, contact_name=$4, center_phone=$5, center_email=$6, data_collection_start_date=$7, contract_send_status=$8, contract_send_comment=$9, contract_agreed=$10, contract_agreement_comment=$11, contract_signed=$12, contract_signed_comment=$13, contract_sign_date=$14 where id=$1', [
        id,
        companyName,
        categoryId,
        contactPerson,
        phone,
        mail,
        infoCollectionDate,
        sendContractStatus,
        sendContractComments,
        contractAgreedStatus,
        contractAgreedComments,
        contractSignedStatus,
        contractSignedComments,
        contractSignedDate,
    ], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(true)
    })
}

const updateOperationPersonal2Row = (request, response) => {
    const {
        id,
        companyName,
        categoryId,
        contactPerson,
        phone,
        mail,

        infoCollectionDate,
        expectedResult,
        startRequirements,
        courseDuration,
        courseAges,
        courseType,
        courseFormat,
        courseDesc,
        coursePrice,
        courseSchedule,
        courseTitle,
        centerDesc,
        centerAddress,
        centerInst,
        centerFacebook,
        centerWebsite,
        centerPhone,
        //centerMail,
        centerLogo,
        placementDate
    } = request.body;

    pool.query('update crm set center_name=$2, center_category_id=$3, contact_name=$4, center_phone=$5, center_email=$6, data_collection_date=$7, expected_result=$8, start_requirements=$9, duration=$10, ages=$11, type=$12, format=$13, course_description=$14, price=$15, schedule=$16, title=$17, center_description=$18, address=$19, instagram=$20, facebook=$21, website=$22, phone=$23, img_src=$24, placement_date=$25 where id=$1', [
        id,
        companyName,
        categoryId,
        contactPerson,
        phone,
        mail,
        infoCollectionDate,
        expectedResult,
        startRequirements,
        courseDuration,
        courseAges,
        courseType,
        courseFormat,
        courseDesc,
        coursePrice,
        courseSchedule,
        courseTitle,
        centerDesc,
        centerAddress,
        centerInst,
        centerFacebook,
        centerWebsite,
        centerPhone,
        //centerMail,
        centerLogo,
        placementDate
    ], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(true)
    })
}

const updateOperationPersonal3Row = (request, response) => {
    const {
        id,
        companyName,
        categoryId,
        contactPerson,
        phone,
        mail,

        reportSendingDate,
        firstCallComments,
        secondCallComments,
        conclusionPaymentStatus,
        tariffPack,
        sendingInvoiceForPaymentStatus,
        paymentReminderComments,
        receivingPaymentStatus,
        providingAccessLKStatus,
        paymentDate
    } = request.body;

    pool.query('update crm set center_name=$2, center_category_id=$3, contact_name=$4, center_phone=$5, center_email=$6, report_send_date=$7, final_call_comment=$8, repeated_final_call_comment=$9, will_pay=$10, payment_invoice_sent=$12, tariff_id=$11, payment_reminder_comment=$13, payment_received=$14, account_provided=$15, payment_date=$16 where id=$1', [
        id,
        companyName,
        categoryId,
        contactPerson,
        phone,
        mail,

        reportSendingDate,
        firstCallComments,
        secondCallComments,
        conclusionPaymentStatus,
        tariffPack,
        sendingInvoiceForPaymentStatus,
        paymentReminderComments,
        receivingPaymentStatus,
        providingAccessLKStatus,
        paymentDate
    ], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(true)
    })
}

const deleteCourseCard = (request, response) => {
    const { courseCardId } = request.body;

    pool.query(`update subcourses set title='test' where id=$1`, [ courseCardId ], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(true)
    })
}

const deleteCourseTeacher = (request, response) => {
    const { teacherId } = request.body;

    pool.query(`update teachers set fullname='test' where id=$1`, [ teacherId ], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(true)
    })
}

const filterCallCenterRows = (request, response) => {
    let {
        centerTitleSearchText,
        directionId,
        firstCallDate,
        kpSendDate,
        secondCallDate,
        meetingDate,
        kpSend,
        meetingSet
    } = request.body;

    let queryText = "SELECT id, center_category_id, call_center_user_id, center_name, contact_name, center_phone, center_email, to_char( first_call_date , 'YYYY-mm-dd') as \"first_call_date\", first_call_time, first_call_comment, to_char( kp_send_date , \'YYYY-mm-dd\') as \"kp_send_date\", to_char( second_call_date , \'YYYY-mm-dd\') as \"second_call_date\", second_call_time, second_call_comment, to_char( meeting_date , 'YYYY-mm-dd') as \"meeting_date\", meeting_time, saller_user_id, meeting_comitted, meeting_comment, will_conclude_contract, to_char( contract_signing_start_date , \'YYYY-mm-dd\') as \"contract_signing_start_date\", to_char( data_collection_start_date , \'YYYY-mm-dd\') as \"data_collection_start_date\", contract_send_status, contract_send_comment, contract_agreed, contract_agreement_comment, contract_signed, contract_signed_comment, to_char( contract_sign_date , 'YYYY-mm-dd') as \"contract_sign_date\", operation_personal_user_id FROM public.crm";

    let whereAdded = false;

    if(centerTitleSearchText !== ''){
        centerTitleSearchText = centerTitleSearchText.toLowerCase();
        queryText += ` where (lower(center_name) like '${centerTitleSearchText}%' or lower(center_name) like '%${centerTitleSearchText}%' or lower(center_name) like '%${centerTitleSearchText}')`;
        whereAdded = true;
    }

    console.log("kpSend: " + kpSend);
    console.log("ТИП kpSend: " + typeof(kpSend));

    if(directionId !== '0'){
        if(whereAdded){
            queryText += ` and `;
        }else{
            queryText += ` where `;
        }

        queryText += `center_category_id=${directionId}`;
    }

    if(firstCallDate !== null){
        if(whereAdded){
            queryText += ` and `;
        }else{
            queryText += ` where `;
        }

        queryText += `first_call_date='${firstCallDate}'`;
    }

    if(kpSendDate !== null){
        if(whereAdded){
            queryText += ` and `;
        }else{
            queryText += ` where `;
        }

        queryText += `kp_send_date='${kpSendDate}'`;
    }

    if(secondCallDate !== null){
        if(whereAdded){
            queryText += ` and `;
        }else{
            queryText += ` where `;
        }

        queryText += `second_call_date='${secondCallDate}'`;
    }

    if(meetingDate !== null){
        if(whereAdded){
            queryText += ` and `;
        }else{
            queryText += ` where `;
        }

        queryText += `meeting_date='${meetingDate}'`;
    }

    if(kpSend !== false){
        if(whereAdded){
            queryText += ` and `;
        }else{
            queryText += ` where `;
        }

        queryText += `kp_send_date is not null`;
    }

    if(meetingSet !== false){
        if(whereAdded){
            queryText += ` and `;
        }else{
            queryText += ` where `;
        }

        queryText += `meeting_date is not null and meeting_time is not null`;
    }

    console.log("ЗАПРОС ДЛЯ ФИЛЬТРА КОЛЛ_ЦЕНТРА");
    console.log(queryText);

    pool.query(queryText, (error, results) => {
        if (error) {
            throw error
        }
        console.log("Result");
        console.log(results.rows);
        response.status(200).json({rows: results.rows, length: results.rows.length});
    })
}

const createCourseNotification = (request, response) => {
    const {
        center_id,
        message
    } = request.body

    pool.query('INSERT INTO center_account_notifications (center_id, message, checked, datetime) VALUES ($1, $2, $3, current_timestamp)', [center_id, message, false], (error, result) => {
        if (error) {
            throw error
        }
        response.status(201).send(`center_account_notifications added with ID: ${result.id}`)
    })
}

const getCourseNotification = (request, response) => {
    const {
        center_id
    } = request.body

    pool.query('SELECT id, center_id, message, checked, datetime, (select count(id) from center_Account_notifications where checked=false and center_id=$1) as "new_notifications_count" from center_account_notifications where center_id=$1 order by checked asc', [center_id], (error, result) => {
        if (error) {
            throw error
        }

        let new_notifications_count = 0;

        if(result.rows.length > 0) {
            new_notifications_count = result.rows[0].new_notifications_count;
        }

        response.status(200).json({data: result.rows, new_notifications_count: new_notifications_count});
    })
}

const checkCourseNotification = (request, response) => {
    const { notification_id } = request.body;

    pool.query(`update center_account_notifications set checked=true where id=$1`, [ notification_id ], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(true)
    })
}

const createTechSupportTicket = async (request, response) => {
    const {
        center_id,
        message
    } = request.body;
    pool.query(`INSERT INTO public.tech_support_tickets(center_id, message, datetime) VALUES ($1, $2, current_timestamp)`, [ center_id, message ], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(true)
    })

    await pool.query(`select * from courses where id=${center_id}`, async (error, results) => {
        if (error) {
            throw error
        }
        let centerTitle = results.rows[0].title;
        let mailMessage = `Центр: ${centerTitle}\nСообщение отправителя: ${message}`;
        await sendEmail(stuffEmails, 'Oilan. Обращение в тех. поддержку', mailMessage);
    })
}

const sendEmail = async (emailsTo, title, message) => {
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'oilanedu@gmail.com',
            pass: 'dyvldkxooosevhon'
        }
    });

    for(let i = 0; i < emailsTo.length; i++){
        let mailOptions = {
            from: 'oilanedu@gmail.com',
            to: emailsTo[i],
            subject: title,
            text: message,
        };

        await transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }
}

const createCourseSearchTicket = async (request, response) => {
    const {
        city_id,
        direction_id,
        isOnline,
        name,
        age,
        phone,
        email,
        message
    } = request.body;

    let uuidString = uuidv4();

    await pool.query(`INSERT INTO public.course_search_tickets(city_id, direction_id, is_online, name, age, phone, email, message, datetime, is_active, uuid_string) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, current_timestamp, true, $9)`,
        [
            city_id,
            direction_id,
            isOnline,
            name,
            age,
            phone,
            email,
            message,
            uuidString
        ],
        (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json({uuid: uuidString});
    })

    let cityName = "";
    let directionName = "";

    await pool.query(`select name from course_categories where id=${direction_id}`,
        async (error, categoriesResult) => {
            if (error) {
                throw error
            }
            directionName = categoriesResult.rows[0].name;
            let mailMessage = `Имя пользователя: ${name}.\nТелефон: ${phone}.\nВыбранное направление: ${directionName}\nСообщение: ${message}`;
            await sendEmail(stuffEmails, 'Oilan. Новая заявка на поиск курса!', mailMessage);

            // pool.query(`select email from courses where direction_id=${direction_id}`,
            //     async (error, coursesResult) => {
            //         if (error) {
            //             throw error
            //         }
            //         let coursesEmails = [];
            //
            //         for (let i = 0; i < coursesResult.rows.length; i++){
            //             coursesEmails.push(coursesResult.rows[i]);
            //         }
            //
            //         for(let i = 0; i < coursesEmails.length; i++){
            //             await sendEmail(coursesEmails, 'Oilan. Новая заявка на поиск курса!', mailMessage);
            //         }
            //     }
            // )
        }
    )
}

const courseCardsWithPagination = async (request, response) => {
    const {
        currentPage,
        cardsNum
    } = request.body;

    pool.query(`SELECT subcourses.id, subcourses.isonline, subcourses.title, courses.website_url, subcourses.currency, subcourses.unit_of_time, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, courses.id as "course_id", courses.title as "course_title", courses.phones, courses.instagram, courses.latitude, courses.longitude, courses.url, courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id where subcourses.approved=true order by order_coefficient desc limit ${Number(cardsNum)} offset ${Number(currentPage * cardsNum)}`, [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows)
    })
}

const archiveCard = (request, response) => {
    const {
        card_id
    } = request.body;

    pool.query(`update subcourses set is_archived=true where id=${card_id}`, [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(`card id ${card_id} archived!`);
    })
}

const unarchiveCard = (request, response) => {
    const {
        card_id
    } = request.body;

    pool.query(`update subcourses set is_archived=false where id=${card_id}`, [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(`card id ${card_id} unarchived!`);
    })
}

const createAccountForAllCenters = () => {
    pool.query(`select id, url from courses`, (error, results) => {
        if (error) {
            throw error
        }
        let courses = results.rows;

        for(let i = 0; i < courses.length; i++){
            let newLoginPassword = courses[i].url + "123";
            let centerId = Number(courses[i].id);

            if(centerId !== 26 && centerId !== 10 && centerId !== 2 && centerId !== 19 && centerId !== 38 && centerId !== 46 && centerId !== 44 && centerId !== 39){
                pool.query(`insert into users(login, password, role_id, center_id) values($1, $2, $3, $4)`, [newLoginPassword, newLoginPassword, 4, centerId], (error, results) => {
                    if (error) {
                        throw error
                    }
                    console.log("account created " + newLoginPassword)
                })
            }
        }
    })
}

const getCourseSearchApplications = (request, response) => {
    pool.query(`select * from course_search_tickets`, [], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows);
    })
}

const getCourseSearchApplication = (request, response) => {
    const {
        uuid_string
    } = request.body;

    console.log("uuid:" + uuid_string)

    pool.query(`select * from course_search_tickets where uuid_string=$1`, [uuid_string.toString()], (error, results) => {
        if (error) {
            throw error
        }
        response.status(200).json(results.rows[0]);
    })
}

const responseToSearchApplication = (request, response) => {
    const {
        application_id,
        subcourse_id,
        center_name,
        center_id
    } = request.body;

    pool.query(`insert into application_responses(application_id, subcourse_id, center_name, accepted, center_id) values($1, $2, $3, $4, $5)`,
        [
            application_id,
            subcourse_id,
            center_name,
            false,
            center_id
        ],
        (error, results) => {
        if (error) {
            throw error
        }
        console.log(`application response created by center ${center_name} to application id: ${application_id}`);
        response.status(201).json(true);
    })
}

const getApplicationResponses = (request, response) => {
    const {
        application_id
    } = request.body;

    pool.query(`select * from application_responses where application_id=$1`, [application_id], (error, results) => {
        if (error) {
            throw error
        }
        let applicationResponses = results.rows;
        let cardsIds = [];

        applicationResponses.map(item => {
            cardsIds.push(item.subcourse_id);
        })

        let cardsIdsString = cardsIds.join(',');
        //let cardsFetchQuery = `select * from subcourses where id in (${cardsIdsString})`
        let cardsFetchQuery = `SELECT subcourses.id, subcourses.isonline, subcourses.title, courses.website_url, subcourses.currency, subcourses.unit_of_time, subcourses.description, subcourses.ages, subcourses.type, subcourses.format, subcourses.price, subcourses.schedule, subcourses.expected_result, subcourses.start_requirements, subcourses.duration, subcourses.rating, courses.id as "course_id", courses.title as "course_title", courses.phones, courses.instagram, courses.latitude, courses.longitude, courses.url, courses.img_src, courses.background_image_url from subcourses inner join courses on subcourses.course_id = courses.id where subcourses.id in (${cardsIdsString}) and subcourses.approved=true and subcourses.is_archived=false order by order_coefficient asc`;
        pool.query(cardsFetchQuery, (error, cardsResults) => {
            if (error) {
                throw error
            }
            console.log(cardsResults.rows)
            response.status(200).json(cardsResults.rows);
        })
    })
}

export default {
    getApplicationResponses,
    responseToSearchApplication,
    getCourseSearchApplication,
    getCourseSearchApplications,
    unarchiveCard,
    archiveCard,
    courseCardsWithPagination,
    createCourseSearchTicket,
    createTechSupportTicket,
    checkCourseNotification,
    getCourseNotification,
    createCourseNotification,
    filterCallCenterRows,
    deleteCourseTeacher,
    deleteCourseCard,
    updateOperationPersonal1Row,
    updateOperationPersonal2Row,
    updateOperationPersonal3Row,
    callCenterAddCenter,
    updateCallCenterRow,
    updateSellerRow,
    loadSallerInfo,
    loadOperationPersonal1Info,
    loadOperationPersonal2Info,
    loadOperationPersonal3Info,
    loadCallCenterInfo,
    cardCreationPermission,
    getClickStatistics,
    getEditCards,
    sendEditCard,
    getCourseCategories,
    getCrmCourseCategories,
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
