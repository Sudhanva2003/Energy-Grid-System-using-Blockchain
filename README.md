This is a simple and easy to use Energy grid system built using plain javascript.
It uses truffle to connect to Ethereum blockchain, and ganache to display the overall transaction data.

The system is designed to give a secure way for energy providers to enlist them on the website using 
thier metamask, and set the prices in ethers for 1 unit of energy, which recievers can recieve by paying
through thier wallets from thier required provider.

commands to run:
truffle migrate -- network deployment
//will both compile and deploy the smart contract
node server.js will run the website on localhost 3000

We have a simple ui for now
![image](https://github.com/user-attachments/assets/538d1a28-3c5a-4622-9bbe-3ea02af64cfc)
through this the provider can connect his wallet

now to register he as a producer he can confirm by paying a small gas fee(for now ganache accounts are taken as producer)
![image](https://github.com/user-attachments/assets/8056ebaa-6be7-4df3-8dd8-47f94c8cbe93)

you can do the same with the consumer and you can click on buy token to buy a token from the producer
![image](https://github.com/user-attachments/assets/0cef88db-f4fe-4d1f-97da-6a590114af2d)

you can see the updated wallet balance on ganache
![image](https://github.com/user-attachments/assets/9da52d9d-2ffd-497e-9306-957fc7efd924)





