# Soulbound tokens for customer satisfaction and digital property

This software project is part of the study by Andrea Pinna, Maria Ilaria Lunesu, Roberto Tonelli and Andrea Tiddia, from Department of Mathematics and Computer Science, University of Cagliari.

The study was conducted following the Design Science Research method and includes this software project as a 
proof-of-concept to investigate and answer two research questions.
- RQ1. How do the use of product account and soulbound tokens enhance the traceability and transparency
of product origin and reputation compared to previous blockchain methods? To answer this RQ, a complete
decentralized system was studied and developed, evaluated its performance and usability in real-world scenarios
through specific cost metrics, and compared with existing systems.
- RQ2. What are the key benefits and challenges of using product accounts and soulbound tokens for building and
verifying the reputations of producers and consumers? To answer this RQ, the systemic impact of the system
was assessed at different time scales and dimensions of impact

The repository contains three main folders:
- Contracts: the on-chain component composed of two interconnected soulbound NFT.
- Company-dApp: the user interface for the manufacturing company to create new labels (as QR-code) of the quality products and display 
their collected certificates of satisfaction. 
- Customer-dApp: the user interface for the customer to obtain the digital ownership of a physically-owned product and 
mint certificates of satisfaction.

This repository requires node.js installed in the server and Metamask installed in the browser.
Both smart contracts must be deployed in a public blockchain and their addresses must be saved using the configuration 
page of both dApps.  

