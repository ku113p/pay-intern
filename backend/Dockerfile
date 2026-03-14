ARG RUST_VERSION=1.88.0
ARG APP_NAME=devstage

# Stage 1: Build
FROM rust:${RUST_VERSION}-alpine AS builder
ARG APP_NAME
WORKDIR /app

RUN apk add --no-cache musl-dev sqlite-dev pkgconfig openssl-dev perl make

RUN --mount=type=bind,source=src,target=src \
    --mount=type=bind,source=migrations,target=migrations \
    --mount=type=bind,source=Cargo.toml,target=Cargo.toml \
    --mount=type=bind,source=Cargo.lock,target=Cargo.lock \
    --mount=type=cache,target=/app/target/ \
    --mount=type=cache,target=/usr/local/cargo/git/db \
    --mount=type=cache,target=/usr/local/cargo/registry/ \
    RUSTFLAGS='-C target-feature=-crt-static' cargo build --locked --release && \
    cp ./target/release/$APP_NAME /bin/server

# Stage 2: Runtime
FROM alpine:3.21 AS final

RUN apk add --no-cache sqlite-libs libgcc ca-certificates wget

ARG UID=10001
RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    appuser

WORKDIR /app

COPY --from=builder /bin/server /bin/
COPY migrations ./migrations

RUN mkdir -p data && chown -R appuser:appuser /app

USER appuser

EXPOSE 3000

ENV DATABASE_URL=sqlite://data/devstage.db

CMD ["/bin/server"]
