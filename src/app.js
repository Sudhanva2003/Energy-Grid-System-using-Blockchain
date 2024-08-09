let contract;
let userAccount;

async function loadWeb3() {
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            web3.eth.getAccounts().then(function (accounts) {
                userAccount = accounts[0];
                initContract();
            });

            // MetaMask account change event listener
            window.ethereum.on('accountsChanged', function (accounts) {
                userAccount = accounts[0];
                console.log("Account changed to: ", userAccount);
                // Optionally reinitialize the contract or refresh the page
                initContract();
            });

        } catch (error) {
            console.error("User denied account access:", error);
        }
    } else {
        console.log("Please install MetaMask!");
    }
}

async function initContract() {
    const response = await fetch('/build/contracts/EnergyGrid.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    const contractAddress = data.networks['5777'].address; // Use '5777' if you are using Ganache
    const contractABI = data.abi;

    contract = new web3.eth.Contract(contractABI, contractAddress);
    console.log("Contract initialized and connected to MetaMask!");
}

async function registerAsProducer() {
    await contract.methods.registerAsProducer().send({ from: userAccount });
    console.log("Registered as Producer!");
}

async function registerAsConsumer() {
    await contract.methods.registerAsConsumer().send({ from: userAccount });
    console.log("Registered as Consumer!");
}

async function buyTokens() {
    const amount = document.getElementById('ethAmount').value;
    await contract.methods.buyTokens().send({ from: userAccount, value: web3.utils.toWei(amount, 'ether') });
    console.log("Tokens purchased!");
}
async function buyEnergy() {
    const producerAddress = document.getElementById('producerAddressEnergy').value;
    const energyAmount = document.getElementById('energyAmount').value;
    try {
        await contract.methods.buyEnergy(producerAddress, energyAmount).send({ from: userAccount });
        console.log(`Energy purchased: ${energyAmount} units from ${producerAddress}`);
    } catch (error) {
        console.error("Error purchasing energy:", error);
    }
}
async function releaseTokensToProducer() {
    const producerAddress = document.getElementById('producerAddressRelease').value;

    if (!producerAddress || !web3.utils.isAddress(producerAddress)) {
        alert("Invalid producer address.");
        return;
    }

    try {
        const receipt = await contract.methods.releaseTokensToProducer(producerAddress).send({ from: userAccount });
        console.log("Transaction receipt:", receipt);
        alert("Tokens successfully converted to Ether and transferred to producer.");
        await checkContractBalance();

        // Optionally, refresh the producer's balance display or other relevant UI elements.
        getProducerBalance(producerAddress);
    } catch (error) {
        console.error("Error releasing tokens:", error);
        alert(`Error releasing tokens: ${error.message}`);
    }
}
async function displayTokenToEtherRate() {
    const rate = await contract.methods.tokenToEtherRate().call();
    console.log(`Current token to Ether rate: 1 token = ${rate} Wei`);
    document.getElementById('rateDisplay').innerText = `1 token = ${rate} Wei`;
}
async function checkContractBalance() {
    const balanceWei = await web3.eth.getBalance(contract.options.address);
    const balanceEther = web3.utils.fromWei(balanceWei, 'ether');
    console.log(`Contract balance is: ${balanceEther} ETH`);
    alert(`Contract balance is: ${balanceEther} ETH`);
    return balanceEther; // This returns the balance as a string in Ether
}
async function getProducerBalance(producerAddress) {
    const balanceWei = await web3.eth.getBalance(producerAddress);
    const balanceEther = web3.utils.fromWei(balanceWei, 'ether');
    console.log(`Producer's Ether balance: ${balanceEther} ETH`);
    // Add any necessary UI update logic here
}
async function registerAsRetailer() {
    await contract.methods.registerAsRetailer().send({ from: userAccount });
    console.log("Registered as Retailer!");
}
// async function getEnergyRate() {
//     const rate = await contract.methods.energyRate().call();
//     return rate; // This returns the rate as a string
// }
async function buyEnergyFromRetailer() {
    const retailerAddress = document.getElementById('retailerAddress').value;
    const energyAmount = document.getElementById('energyAmountRetailer').value;
    
    try {
        // Assuming energyRate is in Wei and is the cost of 1 unit of energy
        const energyRateWei = await contract.methods.retailenergyrate().call(); // This should be in Wei
        
        // Calculate the total cost in Wei
        const totalCostWei = BigInt(energyAmount) * BigInt(energyRateWei);
        
        // Convert the total cost back to Ether for display purposes
        const totalCostEther = web3.utils.fromWei(totalCostWei.toString(), 'ether');
        
        // Send the transaction with the total cost in Wei
        const receipt = await contract.methods.buyEnergyFromRetailer(retailerAddress, energyAmount).send({
            from: userAccount,
            value: totalCostWei.toString() // Use toString() to handle large numbers
        });

        console.log(`Energy purchased from retailer: ${energyAmount} units for ${totalCostEther} ETH`);
        alert(`Successfully purchased ${energyAmount} units of energy from the retailer for ${totalCostEther} ETH.`);
    } catch (error) {
        console.error("Error buying energy from retailer:", error);
        alert(`Error purchasing energy from retailer: ${error.message}`);
    }
}
async function retailerPaysProducer() {
    const producerAddress = document.getElementById('producerAddressPay').value;
    const etherAmount = document.getElementById('tokenAmount').value; // This is the amount in Ether

    // Convert Ether to Wei for the transaction value
    const weiAmount = web3.utils.toWei(etherAmount, 'ether');

    try {
        await contract.methods.retailerPaysProducer(producerAddress).send({
            from: userAccount,
            value: weiAmount // Send the value in Wei
        });
        console.log(`Retailer paid producer: ${etherAmount} ETH`);
        alert(`Successfully paid producer ${etherAmount} ETH.`);
    } catch (error) {
        console.error("Error paying producer:", error);
        alert(`Error paying producer: ${error.message}`);
    }
}
async function buyEnergyFromProducer(producerAddress, energyAmount) {
    try {
        // Assuming retailenergyrate is in Wei and is the cost of 1 unit of energy
        const energyRateWei = await contract.methods.retailenergyrate().call(); // This should be in Wei
        
        // Calculate the total cost in Wei
        const totalCostWei = BigInt(energyAmount) * BigInt(energyRateWei);
        
        // Send the transaction with the total cost in Wei
        const receipt = await contract.methods.buyEnergyFromProducer(producerAddress, energyAmount).send({
            from: userAccount,
            value: totalCostWei.toString() // Convert BigInt to string for sending
        });

        console.log(`Energy purchased from producer: ${energyAmount} units for ${web3.utils.fromWei(totalCostWei.toString(), 'ether')} ETH`);
        alert(`Successfully purchased ${energyAmount} units of energy from the producer for ${web3.utils.fromWei(totalCostWei.toString(), 'ether')} ETH.`);
    } catch (error) {
        console.error("Error buying energy from producer:", error);
        alert(`Error purchasing energy from producer: ${error.message}`);
    }
}
async function checkConsumedEnergy() {
    try {
        const consumedEnergy = await contract.methods.checkConsumedEnergy().call({ from: userAccount });
        console.log(`Consumed energy: ${consumedEnergy}`);
        alert(`Your consumed energy: ${consumedEnergy}`);
    } catch (error) {
        console.error("Error checking consumed energy:", error);
        alert(`Error checking consumed energy: ${error.message}`);
    }
}
async function payForConsumedEnergy() {
    const producerAddress = document.getElementById('producerAddressPay').value; // Get producer address from the input
    const consumedEnergy = await contract.methods.checkConsumedEnergy().call({ from: userAccount });

    // Check if there is any consumed energy to pay for
    if (consumedEnergy > 0) {
        const retailEnergyRate = await contract.methods.retailenergyrate().call();
        const costWei = web3.utils.toWei((consumedEnergy * retailEnergyRate).toString(), 'ether');

        try {
            await contract.methods.payForConsumedEnergy(producerAddress).send({
                from: userAccount,
                value: costWei
            });
            console.log(`Paid for consumed energy: ${consumedEnergy} units to producer ${producerAddress}`);
            alert(`Successfully paid for ${consumedEnergy} units of consumed energy to producer.`);
        } catch (error) {
            console.error("Error paying for consumed energy:", error);
            alert(`Error paying for consumed energy: ${error.message}`);
        }
    } else {
        alert("No consumed energy to pay for.");
    }
}