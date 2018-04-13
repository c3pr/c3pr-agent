@echo off
set VERSION=4.0.0
cd ..
call npm run bundle
cd release
docker build . --build-arg AGENT_VERSION=%VERSION% -t c3pr-agent-build
docker run -v %~dp0..\dist:/c3pr c3pr-agent-build
git add -A ..
git commit -m "[%VERSION%] release new version"
git tag %VERSION%
echo #
echo # IMPORTANT: Notice the generated executable is not added to source control, but should be uploaded to github releases page.
echo #