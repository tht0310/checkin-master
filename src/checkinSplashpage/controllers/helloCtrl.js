const router = Express.Router();

router.get('/', (req, res, next) => {    
        return res.send("<h1 style='text-align: center; font-size:200px'>:)</h1>");
})

module.exports = router;