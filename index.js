const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const db = require('./queries')
let cors = require('cors')

app.use(cors())

let whitelist = ['http://localhost:3000', 'https://www.oilan.io']
let corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)

app.get('/', (request, response) => {
    response.json({ info: 'Node.js, Express, and Postgres API' })
})

app.get('/feedbacks', db.getFeedbacks)
app.get('/feedbacks/:id', db.getFeedbackById)
app.post('/feedbacks', db.createFeedback)
app.put('/feedbacks/:id', db.updateFeedback)
app.delete('/feedbacks/:id', db.deleteFeedback)
app.get('/courses', db.getCourses)
app.get('/courses/:id', db.getCourseById)
app.get('/courses/:categoryId', db.getCoursesByCategory)
app.post('/courses', db.createCourse)
app.put('/courses/:id', db.updateCourse)
app.delete('/courses/:id', db.deleteCourse)
app.get('/subcourses', db.getSubcourses)
app.get('/subcourses/:id', db.getSubcourseById)
app.get('/subcourses/:courseId', db.getCourseSubcourses)
app.post('/subcourses', db.createSubcourse)
app.put('/subcourses/:id', db.updateSubcourse)
app.delete('/subcourses/:id', db.deleteSubcourse)
app.get('/clients', db.getClients)
app.get('/clients/:id', db.getClientById)
app.post('/clients', db.createClient)
app.put('/clients/:id', db.updateClient)
app.delete('/clients/:id', db.deleteClient)
app.get('/teachers', db.getTeachers)
app.get('/teachers/:id', db.getTeacherById)
app.post('/teachers', db.createTeacher)
app.put('/teachers/:id', db.updateTeacher)
app.delete('/teachers/:id', db.deleteTeacher)
app.get('/partnershipRequests', db.getPartnershipRequests)
app.get('/partnershipRequests/:id', db.getPartnershipRequestById)
app.post('/partnershipRequests', db.createPartnershipRequest)
app.put('/partnershipRequests/:id', db.updatePartnershipRequest)
app.delete('/partnershipRequests/:id', db.deletePartnershipRequest)
app.get('/handlePayment', db.handlePayment)
app.post('/handlePayment', db.handlePaymentPost)

let port = process.env.PORT === undefined ? 3001 : process.env.PORT;

app.listen(port, () => {
    console.log(`Goco backend running on port ${port}.`)
})
