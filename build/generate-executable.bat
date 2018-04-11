docker build . -t c3pr-agent-build
docker run -v %~dp0..\dist:/c3pr c3pr-agent-build