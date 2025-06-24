// fastify.decorate('rooms',);

async function plugin(fastify, opts) {
  const roomsMap = new Map();

  fastify.decorate('roomsMap', roomsMap);
}

module.exports = plugin;