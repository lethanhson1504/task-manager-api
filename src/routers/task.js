const express = require('express')
const Task = require('../model/task')
const router = new express.Router()
const auth = require('../middleware/auth')

router.get('/tasks', auth, async (req, res) => {
    try{
        const match = {}
        const sort = {}

        if(req.query.sortBy) {
            const order = req.query.sortBy.split(':')
            sort[order[0]] = order[1] === 'des' ? -1 : 1
        }

        if(req.query.completed) {
            match.completed = req.query.completed === 'true'
        }

        await req.user.populate({ 
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)

    } catch(e) {
        res.status(500).send()
    }
})

router.patch('/tasks/test', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ description: req.body['description'] })

        if(!task) {
            return res.status(404).send("Can not find this task!")
        } 

        res.send(task)
    } catch(e) {
        res.status(500).send(e)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if(!task) {
            return res.status(404).send("Can not find this task!")
        }
        res.send(task)
    } catch(e) {
        res.status(500).send()
    }
})

router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body)

    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.send(400).send(e)
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['completed', 'description']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    
    if(!isValidOperation) {
        return res.status(400).send({error: 'Invalid updates!'})
    }
    
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if(!task) {
            return res.status(404).send("Can not find this task!")
        }

        updates.forEach((update) => task[update] = req.body[update])
    
        await task.save()

        res.status(200).send(task)

    } catch (e) {
        res.status(400).send(e)
    }
})


router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if(!task) {
            return res.status(404).send({error: "Can not find this task!"})
        }

        task.remove()

        res.status(200).send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})



module.exports = router