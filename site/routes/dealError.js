
module.exports = function (err,res){
    console.error(err);
    res.send(500,{error:err.message});
}
