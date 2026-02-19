const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = new Server(app, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST']
  }
});

const rooms = new Map();

// Game rooms
const gameRooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join room
  socket.on('join-room', (data) => {
    const { roomId, playerName } = data;
    
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, {
        players: [],
        gameState: {
          status: 'waiting',
          currentPlayer: 0,
          deck: [],
          discardPile: []
        }
      });
    }
    
    // Add player to room
    gameRooms.get(roomId).players.push({
      id: socket.id,
      username: playerName,
      socket: socket
    });
    
    // Broadcast room update
    socket.to(roomId).emit('room-updated', gameRooms.get(roomId));
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove player from all rooms
      gameRooms.forEach((room, id) => {
        const playerIndex = room.players.findIndex(p => p.socket === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);
        }
      });
      
      // Clean up empty rooms
      gameRooms.forEach((room, id) => {
        if (room.players.length === 0) {
          gameRooms.delete(id);
        }
      });
    });
  });
  
  // Chess game handlers
  io.of('/chess').on('start-game', (data) => {
    const { roomId } = data;
    const room = gameRooms.get(roomId);
    
    if (room) {
      // Initialize chess game
      room.gameState = {
        status: 'playing',
        currentPlayer: 0,
        deck: createChessDeck(),
        discardPile: [],
        board: Array(8).fill(null),
        white: 'a2',
        black: 'a7',
        enPassant: null,
        lastMove: null,
        moveHistory: []
      };
      
      // Deal cards to players
      room.players.forEach((player, index) => {
        room.players[index].cards = room.deck.splice(0, 16);
      });
      room.deck.splice(16);
      
      // Place initial pieces
      room.board[0][0] = { type: 'rook', color: 'white' };
      room.board[0][7] = { type: 'rook', color: 'black' };
      room.board[7][0] = { type: 'knight', color: 'white' };
      room.board[7][1] = { type: 'bishop', color: 'white' };
      room.board[7][2] = { type: 'bishop', color: 'white' };
      room.board[7][3] = { type: 'queen', color: 'white' };
      room.board[7][4] = { type: 'king', color: 'white' };
      room.board[7][5] = { type: 'pawn', color: 'white' };
      
      room.board[0][1] = { type: 'rook', color: 'black' };
      room.board[0][6] = { type: 'knight', color: 'black' };
      room.board[0][5] = { type: 'bishop', color: 'black' };
      room.board[0][4] = { type: 'queen', color: 'black' };
      room.board[0][3] = { type: 'king', color: 'black' };
      room.board[0][2] = { type: 'bishop', color: 'black' };
      room.board[0][1] = { type: 'knight', color: 'black' };
      room.board[0][0] = { type: 'rook', color: 'black' };
      
      // Black pawns
      for (let i = 0; i < 8; i++) {
        room.board[1][i] = { type: 'pawn', color: 'black' };
      }
      
      room.gameState.currentPlayer = 0;
      room.gameState.white = 'a2';
      room.gameState.black = 'a7';
      
      gameRooms.set(roomId, room);
      socket.to(roomId).emit('game-state', room.gameState);
    }
  });
  
  io.of('/chess').on('move', (data) => {
    const { roomId, from, to, piece, promotion } = data;
    const room = gameRooms.get(roomId);
    
    if (room && room.gameState.status === 'playing') {
      const isValidMove = isValidChessMove(room, from, to, piece, promotion);
      
      if (isValidMove) {
        // Make the move
        room.board[from.row][from.col] = null;
        room.board[to.row][to.col] = { type: piece.type, color: piece.color };
        
        // Handle pawn promotion
        if (piece.type === 'pawn' && ((piece.color === 'white' && to.row === 7) || (piece.color === 'black' && to.row === 0))) {
          room.board[to.row][to.col] = promotion || { type: 'queen', color: piece.color };
          room.enPassant = promotion;
        }
        
        // Update game state
        room.gameState.lastMove = `${piece.type} ${from}${to}`;
        room.gameState.moveHistory.push({
          from,
          to,
          piece,
          promotion,
          timestamp: Date.now(),
          notation: `${from}${to}`
        });
        
        // Switch turns
        room.gameState.currentPlayer = 1 - room.gameState.currentPlayer;
        room.gameState.white = room.gameState.currentPlayer === 0 ? 'black' : 'white';
        room.gameState.black = room.gameState.currentPlayer === 0 ? 'white' : 'black';
        
        // Check for checkmate/stalemate
        if (isCheckmate(room)) {
          room.gameState.status = 'checkmate';
          room.gameState.winner = room.gameState.currentPlayer === 0 ? 'Black' : 'White';
        } else if (isStalemate(room)) {
          room.gameState.status = 'stalemate';
          room.gameState.winner = 'Draw';
        }
        
        gameRooms.set(roomId, room);
        socket.to(roomId).emit('game-state', room.gameState);
      }
    }
  });
  
  // UNO game handlers
  io.of('/uno').on('start-game', (data) => {
    const { roomId } = data;
    const room = gameRooms.get(roomId);
    
    if (room) {
      // Initialize UNO game
      room.gameState = {
        status: 'playing',
        currentPlayer: 0,
        direction: 1,
        currentColor: 'red',
        deck: createUnoDeck(),
        discardPile: [],
        players: room.players.map((player, index) => ({
          ...player,
          cards: [],
          isCurrentPlayer: index === 0
        }))
      };
      
      // Deal 7 cards to each player
      room.players.forEach((player) => {
        for (let i = 0; i < 7; i++) {
          player.cards.push(room.deck.splice(0, 1));
        }
      });
      room.deck.splice(7);
      
      // First card to discard pile
      const firstCard = room.deck.splice(0, 1);
      room.discardPile.push(firstCard);
      
      room.gameState.currentColor = firstCard.color;
      room.gameState.drawPileCount = room.deck.length;
      
      gameRooms.set(roomId, room);
      socket.to(roomId).emit('game-state', room.gameState);
    }
  });
  
  io.of('/uno').on('play-card', (data) => {
    const { roomId, cardIndex } = data;
    const room = gameRooms.get(roomId);
    
    if (room && room.gameState.status === 'playing') {
      const player = room.players[room.gameState.currentPlayer];
      const card = player.cards[cardIndex];
      
      if (card) {
        // Remove card from player's hand
        player.cards.splice(cardIndex, 1);
        
        // Add to discard pile
        room.discardPile.push(card);
        
        // Update current color
        if (card.type !== 'wild') {
          room.gameState.currentColor = card.color;
        } else if (room.gameState.wildColorSelection) {
          room.gameState.currentColor = room.gameState.wildColorSelection;
        }
        
        // Next player's turn
        room.gameState.currentPlayer = 1 - room.gameState.currentPlayer;
        
        // Check for winner
        if (player.cards.length === 0) {
          room.gameState.status = 'uno';
          room.gameState.winner = player.username;
        }
        
        gameRooms.set(roomId, room);
        socket.to(roomId).emit('game-state', room.gameState);
      }
    }
  });
  
  io.of('/uno').on('select-wild-color', (data) => {
    const { roomId, color } = data;
    const room = gameRooms.get(roomId);
    
    if (room) {
      room.gameState.wildColorSelection = color;
      room.gameState.currentColor = color;
      
      gameRooms.set(roomId, room);
      socket.to(roomId).emit('game-state', room.gameState);
    }
  });
  
  io.of('/uno').on('draw-card', (data) => {
    const { roomId } = data;
    const room = gameRooms.get(roomId);
    
    if (room && room.gameState.status === 'playing') {
      const player = room.players[room.gameState.currentPlayer];
      
      if (room.deck.length > 0) {
        player.cards.push(room.deck.splice(0, 1));
        room.deck.splice(0, 1);
        room.gameState.drawPileCount = room.deck.length;
      }
      
      gameRooms.set(roomId, room);
      socket.to(roomId).emit('game-state', room.gameState);
    }
  });
  
  // Helper functions
  function createChessDeck() {
    const deck = [];
    const pieces = ['♔', '♕', '♖', '♗', '♘', '♙'];
    const colors = ['white', 'black'];
    
    // Add pieces for each side
    colors.forEach(color => {
      pieces.forEach(piece => {
        deck.push({ id: `${color}-${piece}`, type: piece, color });
      });
    });
    
    return deck;
  }
  
  function createUnoDeck() {
    const deck = [];
    const colors = ['red', 'blue', 'green', 'yellow'];
    const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const actions = ['skip', 'reverse', 'draw2'];
    const wilds = ['wild', 'wild4'];
    
    // Add number cards
    colors.forEach(color => {
      values.forEach(value => {
        deck.push({ id: `${color}-${value}`, type: 'number', color });
      });
    });
    
    // Add action cards
    colors.forEach(color => {
      actions.forEach(action => {
        deck.push({ id: `${color}-${action}`, type: 'action', color });
      });
    });
    
    // Add wild cards
    for (let i = 0; i < 4; i++) {
      wilds.forEach(wild => {
        deck.push({ id: `wild-${i}`, type: 'wild', color: 'wild' });
      });
    }
    
    return deck;
  }
  
  function isValidChessMove(room, from, to, piece, promotion) {
    // Basic validation
    if (!room || !from || !to) return false;
    if (!piece) return false;
    
    const fromRow = parseInt(from[1]);
    const fromCol = from[0].toLowerCase();
    const toRow = parseInt(to[1]);
    const toCol = to[0].toLowerCase();
    
    // Check if piece belongs to player
    const playerPieces = room.board[fromRow].filter(p => p && p.color === (room.gameState.currentPlayer === 0 ? 'white' : 'black'));
    
    if (playerPieces.length === 0) return false;
    
    // Validate move based on piece type
    switch (piece.type) {
      case 'pawn':
        // Pawn moves
        if (fromCol === toCol && Math.abs(toRow - fromRow) === 1) {
          // Forward move
          if (toRow === 7 && room.board[6][toCol]) return false; // Blocked by own piece
          return true;
        } else if (fromCol === toCol && Math.abs(toRow - fromRow) === 2) {
          // Double move
          if (toRow === fromRow && room.board[toRow][toCol - 1] && room.board[toRow][toCol + 1]) return false; // Blocked by own piece
          return true;
        } else if (Math.abs(toRow - fromRow) === 1) {
          // Diagonal capture
          const capturedPiece = room.board[toRow + (toCol > fromCol ? -1 : 1)][toCol];
          if (capturedPiece && capturedPiece.color !== (room.gameState.currentPlayer === 0 ? 'white' : 'black')) {
            room.board[toRow][toCol] = null;
            room.board[fromRow][fromCol] = null;
            return true;
          }
        }
        break;
        
      case 'rook':
        // Rook moves
        if (fromRow === toRow) {
          // Horizontal moves
          for (let col = 0; col < 8; col++) {
            if (room.board[fromRow][col] && room.board[fromRow][col].color === (room.gameState.currentPlayer === 0 ? 'white' : 'black')) {
              // Check if path is clear
              let pathClear = true;
              for (let c = fromCol + 1; c < toCol; c++) {
                if (room.board[fromRow][c]) pathClear = false;
              }
              if (pathClear) {
                room.board[toRow][c] = null;
                room.board[fromRow][col] = piece;
                return true;
              }
            }
          }
        } else if (fromCol !== toCol) {
          // Vertical moves
          for (let row = fromRow; row !== toRow; row++) {
            if (room.board[row][fromCol] && room.board[row][fromCol].color === (room.gameState.currentPlayer === 0 ? 'white' : 'black')) {
              // Check if path is clear
              let pathClear = true;
              for (let c = fromCol + 1; c < toCol; c++) {
                if (room.board[row][c]) pathClear = false;
              }
              if (pathClear) {
                room.board[row][c] = null;
                room.board[fromRow][col] = piece;
                return true;
              }
            }
          }
        }
        break;
        
      case 'knight':
        // Knight moves
        const knightRowDiff = toRow - fromRow;
        const knightColDiff = toCol - fromCol;
        
        if (Math.abs(knightRowDiff) === 2 && Math.abs(knightColDiff) === 1) {
          // L-shaped move
          const targetRow = fromRow + (knightRowDiff > 0 ? 1 : -1);
          const targetCol = fromCol + (knightColDiff > 0 ? 1 : -1);
          
          if (room.board[targetRow][targetCol] && room.board[targetRow][targetCol].color === (room.gameState.currentPlayer === 0 ? 'white' : 'black')) {
            room.board[targetRow][targetCol] = null;
            room.board[fromRow][fromCol] = null;
            return true;
          }
        }
        break;
        
      case 'bishop':
        // Diagonal moves
        const bishopRowDiff = toRow - fromRow;
        const bishopColDiff = toCol - fromCol;
        
        if (Math.abs(bishopRowDiff) === Math.abs(bishopColDiff)) {
          const targetRow = fromRow + (bishopRowDiff > 0 ? 1 : -1);
          const targetCol = fromCol + (bishopColDiff > 0 ? 1 : -1);
          
          if (room.board[targetRow][targetCol] && room.board[targetRow][targetCol].color === (room.gameState.currentPlayer === 0 ? 'white' : 'black')) {
            room.board[targetRow][targetCol] = null;
            room.board[fromRow][fromCol] = null;
            return true;
          }
        }
        break;
        
      case 'queen':
        // Queen moves
        const queenRowDiff = toRow - fromRow;
        const queenColDiff = toCol - fromCol;
        
        // Can move any direction
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (room.board[r][c] && room.board[r][c].color === (room.gameState.currentPlayer === 0 ? 'white' : 'black')) {
              // Check if path is clear
              let pathClear = true;
              for (let cc = fromCol + 1; cc < toCol; cc++) {
                if (room.board[r][cc]) pathClear = false;
              }
              if (pathClear) {
                room.board[r][cc] = null;
                room.board[fromRow][cc] = piece;
                return true;
              }
            }
          }
        }
        break;
        
      default:
        return false;
    }
  }
  
  function isCheckmate(room) {
    // Simplified checkmate detection
    const currentPlayer = room.gameState.currentPlayer === 0 ? 'white' : 'black';
    const kingRow = currentPlayer === 'white' ? 0 : 7;
    
    // Check if king has any valid moves
    const king = room.board[kingRow][4];
    if (!king) return false;
    
    // Check if king is in check
    const hasValidMove = false;
    for (let col = 0; col < 8; col++) {
      if (room.board[kingRow][col]) {
        hasValidMove = true;
        break;
      }
    }
    
    return !hasValidMove;
  }
  
  function isStalemate(room) {
    // Simplified stalemate detection
    const currentPlayer = room.gameState.currentPlayer === 0 ? 'white' : 'black';
    
    // Check if current player has no valid moves
    const hasValidMove = false;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = room.board[row][col];
        if (piece && piece.color === (currentPlayer === 'white' ? 'white' : 'black')) {
          hasValidMove = true;
          break;
        }
      }
    }
    
    return !hasValidMove && room.players.length > 1;
  }
  
  function createRoom(roomId) {
    if (!gameRooms.has(roomId)) {
      gameRooms.set(roomId, {
        players: [],
        gameState: {
          status: 'waiting',
          currentPlayer: 0,
          deck: [],
          discardPile: [],
          board: Array(8).fill(null),
          white: 'a2',
          black: 'a7',
          enPassant: null,
          lastMove: null,
          moveHistory: []
        }
      });
    }
  }
  
  function joinRoom(roomId, playerName) {
    if (!gameRooms.has(roomId)) {
      createRoom(roomId);
    }
    
    const room = gameRooms.get(roomId);
    if (room && room.players.length < 4) {
      room.players.push({
        id: 'temp-player',
        username: playerName,
        socket: null
      });
    }
  }
  
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });