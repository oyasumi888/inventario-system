-- CreateTable
CREATE TABLE "roles" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activo',

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "rfc" VARCHAR(20),
    "telefono" VARCHAR(20),
    "email" VARCHAR(150),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id_proveedor" SERIAL NOT NULL,
    "nombre_empresa" VARCHAR(150) NOT NULL,
    "contacto" VARCHAR(100),
    "telefono" VARCHAR(20),
    "email" VARCHAR(150),

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id_proveedor")
);

-- CreateTable
CREATE TABLE "almacenes" (
    "id_almacen" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "direccion" VARCHAR(255),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activo',

    CONSTRAINT "almacenes_pkey" PRIMARY KEY ("id_almacen")
);

-- CreateTable
CREATE TABLE "unidades_medida" (
    "id_unidad" SERIAL NOT NULL,
    "nombre_presentacion" VARCHAR(100) NOT NULL,
    "abreviatura" VARCHAR(20) NOT NULL,

    CONSTRAINT "unidades_medida_pkey" PRIMARY KEY ("id_unidad")
);

-- CreateTable
CREATE TABLE "productos" (
    "id_producto" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "id_unidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "costo" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "inventario_almacen" (
    "id_inventario" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "id_almacen" INTEGER NOT NULL,
    "cantidad_disponible" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventario_almacen_pkey" PRIMARY KEY ("id_inventario")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id_movimiento" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "id_almacen" INTEGER NOT NULL,
    "id_proveedor" INTEGER,
    "id_usuario" INTEGER NOT NULL,
    "tipo_movimiento" VARCHAR(20) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referencia" VARCHAR(100),

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id_movimiento")
);

-- CreateTable
CREATE TABLE "notas_venta" (
    "id_nota_venta" SERIAL NOT NULL,
    "fecha_venta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_cliente" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "estatus" VARCHAR(20) NOT NULL DEFAULT 'Pendiente',

    CONSTRAINT "notas_venta_pkey" PRIMARY KEY ("id_nota_venta")
);

-- CreateTable
CREATE TABLE "detalle_notas_venta" (
    "id_detalle_nota" SERIAL NOT NULL,
    "id_nota_venta" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "id_almacen" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_vendido" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "detalle_notas_venta_pkey" PRIMARY KEY ("id_detalle_nota")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id_factura" SERIAL NOT NULL,
    "id_nota_venta" INTEGER NOT NULL,
    "fecha_facturacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rfc_cliente" VARCHAR(20) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "impuestos" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id_factura")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "inventario_almacen_id_producto_id_almacen_key" ON "inventario_almacen"("id_producto", "id_almacen");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_id_nota_venta_key" ON "facturas"("id_nota_venta");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_id_unidad_fkey" FOREIGN KEY ("id_unidad") REFERENCES "unidades_medida"("id_unidad") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_almacen" ADD CONSTRAINT "inventario_almacen_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_almacen" ADD CONSTRAINT "inventario_almacen_id_almacen_fkey" FOREIGN KEY ("id_almacen") REFERENCES "almacenes"("id_almacen") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_almacen_fkey" FOREIGN KEY ("id_almacen") REFERENCES "almacenes"("id_almacen") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_proveedor_fkey" FOREIGN KEY ("id_proveedor") REFERENCES "proveedores"("id_proveedor") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_venta" ADD CONSTRAINT "notas_venta_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_venta" ADD CONSTRAINT "notas_venta_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_notas_venta" ADD CONSTRAINT "detalle_notas_venta_id_nota_venta_fkey" FOREIGN KEY ("id_nota_venta") REFERENCES "notas_venta"("id_nota_venta") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_notas_venta" ADD CONSTRAINT "detalle_notas_venta_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "productos"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_notas_venta" ADD CONSTRAINT "detalle_notas_venta_id_almacen_fkey" FOREIGN KEY ("id_almacen") REFERENCES "almacenes"("id_almacen") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_id_nota_venta_fkey" FOREIGN KEY ("id_nota_venta") REFERENCES "notas_venta"("id_nota_venta") ON DELETE RESTRICT ON UPDATE CASCADE;
