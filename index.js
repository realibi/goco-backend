const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = 3001
const db = require('./queries')

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
app.post('/courses', db.createCourse)
app.put('/courses/:id', db.updateCourse)
app.delete('/courses/:id', db.deleteCourse)
app.get('/subcourses', db.getSubcourses)
app.get('/subcourses/:id', db.getSubcourseById)
app.post('/subcourses', db.createSubcourse)
app.put('/subcourses/:id', db.updateSubcourse)
app.delete('/subcourses/:id', db.deleteSubcourse)
app.get('/clients', db.getClients)
app.get('/clients/:id', db.getClientById)
app.post('/clients', db.createClient)
app.put('/clients/:id', db.updateClient)
app.delete('/clients/:id', db.deleteClient)

app.listen(port, () => {
    console.log(`Goco backend running on port ${port}.`)
})