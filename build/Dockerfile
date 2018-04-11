FROM maven:3-jdk-8-alpine

RUN apk add --update wget nano unzip git

# While we are developing, one RUN per line is better. When done, use "&& \" to merge them all

RUN mkdir -p /c3pr/project /c3pr/temp /c3pr/agent

# DOWNLOAD TOOL
RUN wget -O /c3pr/temp/walkmod.zip https://bitbucket.org/rpau/walkmod/downloads/walkmod-3.0.0-installer.zip
RUN unzip /c3pr/temp/walkmod.zip -d /c3pr/temp/walkmod
RUN mv /c3pr/temp/walkmod/walkmod-3.0.0 /c3pr/tool

ENV PATH="/c3pr/tool/bin:${PATH}"

# Pre-install all plugins
ADD walkmod.xml /c3pr/temp/walkmod.xml
WORKDIR /c3pr/temp
RUN walkmod install
ADD pom.xml /c3pr/temp/pom.xml
RUN walkmod apply
RUN rm /c3pr/temp/pom.xml

#
# DOWNLOAD c3pr AGENT
#
# NOTE: At this point of development, we expect the agent to change more frequently than the tool, thus it being last in the file.
# When the agent becomes stabler than the tools themselves, it will save time to add it as an "earlier" docker layer
#
RUN wget -O /c3pr/agent/c3pr-agent https://github.com/c3pr/c3pr-agent/releases/download/2.0.0/c3pr-agent-alpine-2.0.0
RUN chmod +x /c3pr/agent/c3pr-agent

EXPOSE 5003

ENTRYPOINT /c3pr/agent/c3pr-agent

