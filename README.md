# Smart Bridge Contract

## How to deploy

1. Create a secret.json file in the root directory with the following content

```json
{
  "privateKey": "your private key"
}
```

2. Run in node environment

```bash
npm install
// NETWORK_NAME: localhost, kovan, ropsten
npx hardhat run --network <NETWORK_NAME> ./scripts/deploy-xx.js
```
