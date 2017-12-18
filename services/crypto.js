const crypto = require("crypto")
    , algorithm = "aes-256-ctr"
    , password = process.env.CRYPTO_PASSWORD;

 
class Crypto {
  static encrypt (text) {
    const cipher = crypto.createCipher(algorithm, password)
    let crypted = cipher.update(text, 'utf8', 'hex')
    
    crypted += cipher.final('hex');
    return crypted;
  }

  static decrypt (text) {
    const decipher = crypto.createDecipher(algorithm, password)
    try {
      let dec = decipher.update(text, "hex", "utf8")
      dec += decipher.final("utf8");
      return dec;  
    } catch (err) {
      return null
    }
  }

  static encryptProjectFullName (username, projectName) {
    return Crypto.encrypt([username, projectName].join(Crypto.SEPARATOR))
  }

  static decryptProjectFullName (text) {
    const res = Crypto.decrypt(text)
        , splits = res.split(Crypto.SEPARATOR)

    return {
      username: splits[0],
      project_name: splits[1]
    }
  }
}

Crypto.SEPARATOR = "|"
 
module.exports = Crypto