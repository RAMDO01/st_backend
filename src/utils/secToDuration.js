//Helper function to convert total seconds to the duraiton formate

function convertSecondsToDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds/3600)
    const minutes = Math.floor((totalSeconds%3600))
    const seconds = Math.floor((totalSeconds % 3600))
    
    if(hours>0){
        return `${hours}h ${minutes}`
    } else if(minutes > 0) {
        return `${minutes}m ${seconds}`
    }else {
        return `${seconds}`
    }

}

module.exports = {convertSecondsToDuration}