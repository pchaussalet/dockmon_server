FROM node

ADD     . /usr/src/app
WORKDIR /usr/src/app

RUN npm install

EXPOSE 9999

CMD [ "node", "app.js" ]