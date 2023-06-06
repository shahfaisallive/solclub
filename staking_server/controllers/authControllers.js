import crypto from "crypto"

export const getMessage = async (req, res) => {
    console.log("getting message");

    const message = crypto.randomBytes(32).toString('hex')

    if (message) {
        res.send({
            status: true,
            message
        })
    } else {
        res.send({
            status: true,
            msg: "Unable to generate message"
        })
    }

}