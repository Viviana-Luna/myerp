#!/usr/bin/env bash
# RuoYi Office 本地开发启停脚本
# 用法: ./dev.sh backend | frontend | stop | status | logs
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

BACKEND_DIR="$ROOT/ruoyi-office"
FRONTEND_DIR="$ROOT/ruoyi-office-vben"
RUN_DIR="$ROOT/.tmp"

JAVA_HOME="${JAVA_HOME:-/Users/luna/Library/Java/JavaVirtualMachines/corretto-21.0.12/Contents/Home}"
MAVEN="$HOME/.m2/wrapper/dists/apache-maven-3.9.12/57e1dc81/bin/mvn"
NODE_BIN="$HOME/.nvm/versions/node/v22.23.4/bin"
MAVEN_REPO="$ROOT/.m2repo"
COREPACK_HOME="$ROOT/.corepack"

BACKEND_LOG="$RUN_DIR/logs/yudao-server.log"
BACKEND_STDOUT="$RUN_DIR/backend.log"
FRONTEND_LOG="$RUN_DIR/frontend.log"

mkdir -p "$RUN_DIR/logs"

backend() {
  local jar="$BACKEND_DIR/yudao-server/target/yudao-server.jar"
  if [ ! -f "$jar" ]; then
    echo "未找到 $jar，请先执行: ./dev.sh build"
    exit 1
  fi
  if curl -s -m 2 -o /dev/null http://127.0.0.1:48080/actuator/health; then
    echo "后端已在 48080 运行"
    return
  fi
  JAVA_HOME="$JAVA_HOME" nohup "$JAVA_HOME/bin/java" -Xms512m -Xmx2g -jar "$jar" \
    --logging.file.name="$BACKEND_LOG" >"$BACKEND_STDOUT" 2>&1 &
  echo "后端启动中 (pid=$!)，日志: $BACKEND_LOG"
}

frontend() {
  if curl -s -m 2 -o /dev/null http://127.0.0.1:5666/; then
    echo "前端已在 5666 运行"
    return
  fi
  cd "$FRONTEND_DIR"
  PATH="$NODE_BIN:$PATH" COREPACK_HOME="$COREPACK_HOME" COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    nohup pnpm dev:antd >"$FRONTEND_LOG" 2>&1 &
  echo "前端启动中 (pid=$!)，日志: $FRONTEND_LOG"
}

build() {
  cd "$BACKEND_DIR"
  JAVA_HOME="$JAVA_HOME" "$MAVEN" -B -ntp -P boot -Dmaven.repo.local="$MAVEN_REPO" \
    -Dmaven.test.skip=true clean package
}

stop() {
  pkill -f "yudao-server.jar" 2>/dev/null && echo "后端已停止" || echo "后端未在运行"
  pkill -f "apps/web-antd.*vite" 2>/dev/null && echo "前端已停止" || echo "前端未在运行"
}

status() {
  printf '%-10s ' "后端 48080:"
  curl -s -m 3 http://127.0.0.1:48080/actuator/health || echo "无响应"
  echo
  printf '%-10s ' "前端 5666:"
  curl -s -m 3 -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:5666/ || echo "无响应"
  echo "MySQL: $(docker exec mysql mysql -uroot -proot -N -e 'SELECT 1' 2>/dev/null || echo '不可用')"
  echo "Redis: $(docker exec myerp-redis redis-cli ping 2>/dev/null || echo '不可用')"
  echo "TDengine: $(docker exec myerp-tdengine taos -s 'SHOW DATABASES;' 2>/dev/null | grep -c ruoyi_vue_pro | sed 's/^1$/可用/;s/^0$/不可用/')"
}

case "${1:-}" in
  backend) backend ;;
  frontend) frontend ;;
  build) build ;;
  stop) stop ;;
  status) status ;;
  logs) tail -n 60 "$BACKEND_LOG" ;;
  *)
    echo "用法: $0 {backend|frontend|build|stop|status|logs}"
    exit 1
    ;;
esac
