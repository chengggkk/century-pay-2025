# Century Pay 2025

## Install

```bash
yarn
```

- Create a .env file

```bash
cp .env.example .env
```

See: [Discord Docs: Fetching your credentials](https://discord.com/developers/docs/quick-start/getting-started#fetching-your-credentials)

- Register commands

```bash
yarn register
```

- Run the server

```bash
yarn dev
```

## Deploy on discord

- Start an ngrok tunnel

```bash
ngrok http 3000
```

- Update the webhook url in the discord dashboard

Example url
```sh
https://<ngrok-id>.ngrok.app/api/interactions
```

See: [Discord Docs: Adding an interaction endpoint URL](https://discord.com/developers/docs/quick-start/getting-started#adding-an-interaction-endpoint-url)
