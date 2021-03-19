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

app.listen(port, () => {
    console.log(`Goco backend running on port ${port}.`)
})