//
// Utilities
//

class CardPool {

  static suits = // 0: spade, 1: heart, 2: diamond, 3: club, 4: none
    [ "s", "h", "d", "c", "" ];

  static ranks = // 0: free card, 1 - 13, 14: black joker, 15: red joker
    [ "f", "a", "2", "3", "4", "5", "6", "7", "8", "9", "0", "j", "q", "k", "bx", "rx" ];

  static createCard(suit, rank) {
    return {
      suit: suit,
      rank: rank,
      id: `${CardPool.suits[suit]}${CardPool.ranks[rank]}`
    };
  }

  constructor(numOfDecks, includeJoker, shuffle) {

    this.cards = [];

    while (numOfDecks --) {
      for (let suit = 0; suit < 4; suit ++) {
        for (let rank = 1; rank < 14; rank ++) {
          this.cards.push(CardPool.createCard(suit, rank));
        }
      }

      if (includeJoker) {
        this.cards.push(CardPool.createCard(4, 14), CardPool.createCard(4, 15));
      }
    }

    shuffle && this.shuffle();
  }

  shuffle() {
    let idx = this.cards.length;

    while (idx != 0) {
      let randIdx = Math.floor(Math.random() * idx);
      idx --;
      [ this.cards[idx], this.cards[randIdx] ] = [ this.cards[randIdx], this.cards[idx] ]; // swap
    }
  }

  draw() {
    return this.cards.shift();
  }
}

//
// Global Settings
//

const defaultBoardSetting = [
  [ 400, 301, 313, 312, 310, 309, 308, 307, 306, 400 ],
  [ 201,   7,   8,   9,  10,  12,  13,   1, 305,   2 ],
  [ 213,   6, 310, 309, 308, 307, 306, 202, 304,   3 ],
  [ 212,   5, 312, 108, 107, 106, 305, 203, 303,   4 ],
  [ 210,   4, 313, 109, 102, 105, 304, 204, 302,   5 ],
  [ 209,   3, 301, 110, 103, 104, 303, 205, 101,   6 ],
  [ 208,   2, 201, 112, 113, 101, 302, 206, 113,   7 ],
  [ 207, 102, 213, 212, 210, 209, 208, 207, 112,   8 ],
  [ 206, 103, 104, 105, 106, 107, 108, 109, 110,   9 ],
  [ 400, 205, 204, 203, 202,   1,  13,  12,  10, 400 ]
];

let boardSetting = defaultBoardSetting; // set to null for randomized board

//
// Vue Components
//

const CardSlot = {
  props: {
    state: Object,
    focusedCard: Object
  },
  emits: [
    "cardClick"
  ],
  computed: {
    imageURL() {
      return `images/cards.svg#${this.state.card.id}`;
    },
    chipImageURL() {
      return `images/chip-${this.state.owner}.png`;
    },
    classObject() {
      return { focused: this.focusedCard && this.state.card.id == this.focusedCard.id };
    }
  },
  methods: {
    click() {
      this.$emit("cardClick", this.state);
    }
  },
  template: `
    <div :class="classObject" @click="click">
      <img v-if="this.state.card.rank == 0" src="images/free-card.png"/>
      <svg v-else role="img"><use :xlink:href="imageURL"/></svg>
      <img v-if="this.state.owner" class="chip" :src="chipImageURL"/>
    </div>`
};

const CardHand = {
  components: {
    CardSlot
  },
  props: {
    cardStates: Array,
    gameState: Object
  },
  emits: [
    "cardClick"
  ],
  methods: {
    cardClick(state) {
      this.$emit("cardClick", state);
    }
  },
  template: `
    <div>
      <card-slot v-for="cardState in cardStates" @card-click="cardClick"
        :state="cardState" :focused-card="gameState.focusedCard"></card-slot>
    </div>`
};

const GameBoard = {
  components: {
    CardSlot
  },
  props: {
    cardStateRows: Array,
    gameState: Object
  },
  emits: [
    "cardClick"
  ],
  methods: {
    cardClick(state) {
      this.$emit("cardClick", state);
    }
  },
  template: `
    <div>
      <div v-for="cardStateRow in cardStateRows">
        <card-slot v-for="cardState in cardStateRow" @card-click="cardClick"
          :state="cardState" :focused-card="gameState.focusedCard"></card-slot>
      </div>
    </div>`
};

//
// Vue App
//

const app = Vue.createApp({
  components: {
    GameBoard,
    CardHand
  },
  data() {
    return {
      boardCardStateRows: [],
      handCardStates: [],
      gameState: {
        focusedCard: null,
        currentPlayer: "green"
      }
    };
  },
  methods: {
    handCardClick(state) {
      this.gameState.focusedCard = state.card;
    },
    boardCardClick(state) {
      state.owner = this.gameState.currentPlayer;
    }
  },
  created() {
    this.cardPool = new CardPool(2, false, true);
    for(let idx = 0; idx < 7; idx ++) {
      this.handCardStates.push({
        card: this.cardPool.draw()
      });
    }

    if (boardSetting) {
      boardSetting.forEach(row => {
        this.boardCardStateRows.push(row.map(entry => ({
          card: CardPool.createCard(Math.floor(entry / 100), entry % 100),
          owner: null
        })));
      });
    }
    else { // randomize board
      let tmpPool = new CardPool(2, false, true);
      for(let row = 0; row < 10; row ++) {
        let cardStateRow = [], card;
        for(let col = 0; col < 10; col ++) {
          if ((row == 0 || row == 9) && (col == 0 || col == 9)) {
            card = CardPool.createCard(4, 0); // free card
          }
          else {
            while((card = tmpPool.draw()).rank == 11); // re-draw on seeing jacks
          }
          cardStateRow.push({
            card: card,
            owner: null
          });
        }
        this.boardCardStateRows.push(cardStateRow);
      }
    }
  }
});

app.mount("#app");
