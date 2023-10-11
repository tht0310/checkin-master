//hashpassword before save it
const preSave = (next) => {
   try {
      if (!this._id) {
         this._id = Util.randomId();
      }

      if (typeof this.name != "undefined") {
         this.keyword = Util.removeDMV(this.name);
      }

      this.createdAt = Util.now();
      this.updatedAt = Util.now();
      next();
   } catch (err) {
      logger.error(err)
   }
}

//hashpassword before save it
const preSaveUser = (next) => {
   try {
      if (!this._id) {
         this._id = Util.randomId();
      }

      if (typeof this.name != "undefined") {
         this.keyword = Util.removeDMV(this.name);
      }

      this.createdAt = Util.now();
      this.updatedAt = Util.now();

      if (typeof this.password != "undefined") {
         this.salt = Util.genSalt();
         this.password = Util.hashPassword(this.password, this.salt);
      }

      next();
   } catch (err) {
      logger.error(err)
   }
}

const preFindOneAndUpdate = (next) => {
   try {
      if (!this._id) {
         this._id = Util.randomId();
      }

      if (typeof this.name != "undefined") {
         this.keyword = Util.removeDMV(this.name);
      }

      this.updatedAt = Util.now();
      next();
   } catch (err) {
      console.error(err)
   }
}

const generateId = () => Util.randomId();

module.exports = {
   preSave,
   preSaveUser,
   preFindOneAndUpdate,
   generateId
}