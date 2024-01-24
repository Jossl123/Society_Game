class Board{
    constructor(){
        this.board = [];
        this.boardRowSize = 10
        this.boardCellNb = this.boardRowSize*2 + (this.boardRowSize-2)*2
    }
}

module.exports = Board