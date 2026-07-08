# VPC module
#
# NAT gateway cost tradeoff (ap-south-1, mid-2026 pricing):
#
#   enable_nat = false (default)
#     • Nodes run in PUBLIC subnets — they get public IPs and route directly
#       to the internet via the IGW.  No NAT charge.
#     • Private subnets exist but have no default route — only use them for
#       resources that must be completely isolated (RDS, ElastiCache, etc.).
#     • Cost: $0/month for NAT.
#     • Risk: node public IPs are reachable from the internet; mitigate with
#       Security Groups (EKS managed node groups do this by default).
#
#   enable_nat = true
#     • A SINGLE NAT gateway is created in the first public subnet.
#       One NAT = one AZ failure point, but fine for a cost-conscious dev env.
#       For production use one NAT per AZ (remove the count trick below).
#     • Private subnets route 0.0.0.0/0 through the NAT — nodes have no
#       public IPs and can't be reached from the internet directly.
#     • Cost: ~$32/month (hourly charge) + $0.045/GB data processed.
#     • Recommendation: keep false until you're running prod workloads.

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  # Subnet definitions: index 0 = AZ-a, index 1 = AZ-b
  public_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
}

# ── Availability zones ───────────────────────────────────────────────────────
# Data-sourced so the module works in any region without hardcoding AZ names.

data "aws_availability_zones" "available" {
  state = "available"
}

# ── VPC ──────────────────────────────────────────────────────────────────────

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true # EKS requires DNS resolution inside the VPC
  enable_dns_hostnames = true # EKS requires DNS hostnames for node registration

  tags = {
    Name = "${local.name_prefix}-vpc"
  }
}

# ── Subnets ──────────────────────────────────────────────────────────────────

resource "aws_subnet" "public" {
  count = 2

  vpc_id            = aws_vpc.this.id
  cidr_block        = local.public_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  # Nodes in public subnets need public IPs to reach ECR/S3 when NAT is off.
  map_public_ip_on_launch = true

  tags = {
    Name                                        = "${local.name_prefix}-public-${count.index + 1}"
    "kubernetes.io/role/elb"                    = "1" # ALB controller uses this to place internet-facing LBs
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.this.id
  cidr_block        = local.private_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name                                        = "${local.name_prefix}-private-${count.index + 1}"
    "kubernetes.io/role/internal-elb"           = "1" # ALB controller uses this for internal LBs
    "kubernetes.io/cluster/${var.cluster_name}" = "shared"
  }
}

# ── Internet gateway ──────────────────────────────────────────────────────────

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

# ── Public route table ────────────────────────────────────────────────────────

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = {
    Name = "${local.name_prefix}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count = 2

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ── NAT gateway (optional) ────────────────────────────────────────────────────
# Single NAT in the first public subnet — one AZ failure point, acceptable for
# dev.  The EIP is only created when enable_nat = true.

resource "aws_eip" "nat" {
  count  = var.enable_nat ? 1 : 0
  domain = "vpc"

  tags = {
    Name = "${local.name_prefix}-nat-eip"
  }

  depends_on = [aws_internet_gateway.this]
}

resource "aws_nat_gateway" "this" {
  count = var.enable_nat ? 1 : 0

  allocation_id = aws_eip.nat[0].id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "${local.name_prefix}-nat"
  }

  depends_on = [aws_internet_gateway.this]
}

# ── Private route table ───────────────────────────────────────────────────────
# When NAT is enabled: route 0.0.0.0/0 through the NAT gateway.
# When NAT is disabled: private subnets are truly isolated — no default route.

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  dynamic "route" {
    for_each = var.enable_nat ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.this[0].id
    }
  }

  tags = {
    Name = "${local.name_prefix}-private-rt"
  }
}

resource "aws_route_table_association" "private" {
  count = 2

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}
