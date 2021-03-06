FROM maven:3-jdk-8-alpine

RUN apk add --update wget nano unzip git

RUN mkdir -p /c3pr/agent

ARG AGENT_VERSION
ENV AGENT_VERSION ${AGENT_VERSION}
# ENV MONGO_LOGS_URI mongodb://localhost:27017/someserver # uncomment for testing, should throw a MongoNetworkError as there's no server there

ADD c3pr-agent-alpine-${AGENT_VERSION} /c3pr/agent/c3pr-agent
RUN chmod +x /c3pr/agent/c3pr-agent

WORKDIR /c3pr

EXPOSE 5003

ENTRYPOINT /c3pr/agent/c3pr-agent

