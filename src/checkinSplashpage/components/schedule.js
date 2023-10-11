//Module Schedule
const cron = require("node-cron");

//Clear All Cache at 23:59:00 every day.
cron.schedule("59 23 * * *", () => {
    logger.info("[CRON]: Start 23:59:00", );

    Cache.clearAll((err, result)=>{
        if(err) logger.error(err)

        logger.info("[Clear All Cache]");
    })
});
