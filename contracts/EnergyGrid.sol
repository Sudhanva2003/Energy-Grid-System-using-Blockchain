// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EnergyGrid {
    struct Account {
        uint balance;  // Token balance held by the user directly
        uint escrow;   // Token balance held in escrow within the contract
        bool isProducer;
        bool isConsumer;
        bool isRetailer;
    }
    struct SmartMeter {
    uint consumedEnergy; // Total energy consumed
    bool isPaid; // Has the consumed energy been paid for?
    }

    mapping(address => SmartMeter) public smartMeters;
    mapping(address => address) public consumerToProducer;
    mapping(address => Account) public accounts;
    mapping(address => address) public retailerToProducer;
    mapping(address => uint) public etherReceivedFromConsumers;
    address public owner; 
    uint public energyRate = 1; // Tokens per unit of energy
    uint public retailenergyrate= 1e18;
    uint public tokenToEtherRate = 1 ether; // 1 token = 1000 Wei

    event EnergyPurchased(address indexed consumer, address indexed producer, uint energyAmount, uint tokenAmount);
    event EnergyTransferred(address indexed producer, uint tokenAmount, uint etherAmount);
    event InsufficientContractBalance(uint requestedAmount, uint availableBalance);
    event RetailerRegistered(address retailer);
    event EnergyPurchasedFromRetailer(address consumer, address retailer, uint energyAmount, uint tokenAmount);

    constructor() {
        owner = msg.sender;
    }

    function registerAsProducer() public {
        accounts[msg.sender].isProducer = true;
    }

    function registerAsConsumer() public {
        accounts[msg.sender].isConsumer = true;
    }

    function registerAsRetailer() public {
      require(!accounts[msg.sender].isProducer && !accounts[msg.sender].isConsumer, "Account cannot be a Producer or a Consumer");
      accounts[msg.sender].isRetailer = true;
      emit RetailerRegistered(msg.sender);
    }

    function buyTokens() public payable {
        accounts[msg.sender].balance += msg.value;
    }

    function buyEnergy(address producer, uint energyAmount) public {
        uint tokenAmount = energyAmount * energyRate;
        require(accounts[msg.sender].balance >= tokenAmount, "Insufficient token balance");

        accounts[msg.sender].balance -= tokenAmount;
        accounts[msg.sender].escrow += tokenAmount;
    }

  function releaseTokensToProducer(address payable producer) public {
    uint tokenAmount = accounts[msg.sender].escrow;
    require(tokenAmount > 0, "No tokens in escrow to release");

    // Calculate the Ether equivalent based on the token rate
    uint etherAmount = tokenAmount * tokenToEtherRate;

    require(address(this).balance >= etherAmount, "Insufficient contract balance");

    // Transfer Ether to the producer
    producer.transfer(etherAmount);

    // Update the escrow and balances
    accounts[msg.sender].escrow -= tokenAmount;

    emit EnergyTransferred(producer, tokenAmount, etherAmount);
}
function buyEnergyFromRetailer(address payable retailer, uint energyAmount) public payable {
    require(accounts[retailer].isRetailer, "Specified address is not a Retailer");
    require(msg.value == energyAmount * retailenergyrate, "Incorrect Ether amount sent");

    // Transfer Ether from Consumer to Retailer
    retailer.transfer(msg.value);
    etherReceivedFromConsumers[retailer] += msg.value;

    emit EnergyPurchasedFromRetailer(msg.sender, retailer, energyAmount, msg.value);
}

function retailerPaysProducer(address payable producer) public payable {
    // Ensure the retailer has received enough Ether from consumers to cover this payment
    require(etherReceivedFromConsumers[msg.sender] >= msg.value, "Insufficient Ether to pay producer");

    // Transfer Ether to the producer
    producer.transfer(msg.value);

    // Decrease the tracked Ether for the retailer
    etherReceivedFromConsumers[msg.sender] -= msg.value;

    // Emit an event for the Ether transfer
    emit EnergyTransferred(producer, 0, msg.value); // The second argument is 0 since we're not using tokens here
}
function buyEnergyFromProducer(address producer, uint energyAmount) public payable {
    // Ensure the consumer has enough Ether to pay
    require(msg.value == energyAmount * retailenergyrate, "Incorrect Ether amount sent");

    // Transfer Ether to the producer
    payable(producer).transfer(msg.value);

    // Record the energy purchase in the consumer's smart meter
    smartMeters[msg.sender].consumedEnergy += energyAmount;
    smartMeters[msg.sender].isPaid = false;

    emit EnergyPurchased(msg.sender, producer, energyAmount, msg.value);
}

// Function for a consumer to check their consumed energy
function checkConsumedEnergy() public view returns (uint) {
    require(accounts[msg.sender].isConsumer, "Only consumers can check consumed energy");
    return smartMeters[msg.sender].consumedEnergy;
}

function payForConsumedEnergy(address payable producer) public payable {
    SmartMeter storage meter = smartMeters[msg.sender];
    require(!meter.isPaid, "Energy already paid for");
    require(accounts[producer].isProducer, "Address is not a registered producer");
    
    // Calculate the cost of consumed energy
    uint cost = meter.consumedEnergy * retailenergyrate;
    require(msg.value == cost, "Incorrect Ether amount sent");
    
    // Ensure the payment is going to the producer from whom the energy was purchased
    require(consumerToProducer[msg.sender] == producer, "Payment must go to the producer from whom the energy was purchased");
    
    // Transfer Ether to the specified producer
    producer.transfer(msg.value);
    
    // Reset the consumer's smart meter
    meter.consumedEnergy = 0;
    meter.isPaid = true;
    
    // Emit an event for the Ether transfer
    emit EnergyTransferred(producer, 0, msg.value);
}

    // Fallback function to accept Ether
    receive() external payable {}
}
