import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { Product } from './entities/product.entity';
import * as fs from 'fs';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { quantity, buyingPrice, sellingPrice } = createProductDto;
    
    // Calculate derived fields
    const totalBuyingCost = buyingPrice * quantity;
    const remainingQty = quantity; // Initially, remaining quantity equals total quantity
    const remainingBuying = remainingQty * buyingPrice;
    const remainingSales = remainingQty * sellingPrice;

    const product = this.productsRepository.create({
      ...createProductDto,
      totalBuyingCost,
      totalSoldQtyLoan: 0,
      totalSoldQtyCash: 0,
      totalSalesLoan: 0,
      totalSalesCash: 0,
      remainingQty,
      remainingBuying,
      remainingSales
    });

    return this.productsRepository.save(product);
  }

  async uploadProductsFromExcel(file: Express.Multer.File): Promise<{ message: string; productsAdded: number }> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      console.log('File received:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      });

      // Read the Excel file from disk
      let workbook;
      try {
        workbook = xlsx.readFile(file.path);
        console.log('Workbook read successfully');
      } catch (error) {
        console.error('Error reading workbook:', error);
        throw new BadRequestException('Failed to read Excel file. Make sure it is a valid Excel file.');
      } finally {
        // Clean up: remove the uploaded file
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new BadRequestException('Excel file has no sheets');
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      if (!worksheet) {
        throw new BadRequestException('Could not read worksheet');
      }

      // Convert to JSON with headers
      const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: null,
        header: 1
      }) as Array<Array<string | null>>;

      if (!jsonData || jsonData.length === 0) {
        throw new BadRequestException('No data found in Excel file');
      }

      // Get headers from first row and clean them
      const headers = (jsonData[0] || []).map(h => h?.toString()?.trim() ?? '');
      console.log('Headers found:', headers);

      // Create a mapping of column indexes
      const columnMap = {
        productName: headers.indexOf('productName'),
        quantity: headers.indexOf('quantity'),
        unity: headers.indexOf('unity'),
        buyingPrice: headers.indexOf('buyingPrice'),
        sellingPrice: headers.indexOf('sellingPrice'),
        totalSoldQtyLoan: headers.indexOf('totalSoldQtyLoan'),
        totalSoldQtyCash: headers.indexOf('totalSoldQtyCash'),
        totalSalesLoan: headers.indexOf('totalSalesLoan'),
        totalSalesCash: headers.indexOf('totalSalesCash')
      };

      console.log('Column mapping:', columnMap);

      // Validate required columns
      if (columnMap.productName === -1 || columnMap.quantity === -1 || columnMap.unity === -1) {
        throw new BadRequestException('Required columns missing. Need: productName, quantity, unity');
      }

      // Process data rows (skip header row)
      const products = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] || [];
        console.log(`Processing row ${i + 1}:`, row);

        // Skip empty rows
        if (!row || (row as Array<string | null>).every(cell => cell === null || cell === '')) {
          console.log(`Skipping empty row ${i + 1}`);
          continue;
        }

        const productName = row[columnMap.productName]?.toString().trim();
        const quantity = Number(row[columnMap.quantity]);
        const unity = row[columnMap.unity]?.toString().trim();

        console.log('Extracted values:', { productName, quantity, unity });

        if (!productName || isNaN(quantity) || !unity) {
          throw new BadRequestException(
            `Row ${i + 1}: Invalid data. Found: productName="${productName}", quantity=${row[columnMap.quantity]}, unity="${unity}"`
          );
        }

        // Convert other values
        const buyingPrice = Number(row[columnMap.buyingPrice]) || 0;
        const sellingPrice = Number(row[columnMap.sellingPrice]) || 0;
        const totalSoldQtyLoan = Number(row[columnMap.totalSoldQtyLoan]) || 0;
        const totalSoldQtyCash = Number(row[columnMap.totalSoldQtyCash]) || 0;
        const totalSalesLoan = Number(row[columnMap.totalSalesLoan]) || 0;
        const totalSalesCash = Number(row[columnMap.totalSalesCash]) || 0;

        // Calculate derived fields
        const totalBuyingCost = buyingPrice * quantity;
        const remainingQty = quantity - totalSoldQtyCash - totalSoldQtyLoan;
        const remainingBuying = remainingQty * buyingPrice;
        const remainingSales = remainingQty * sellingPrice;

        products.push(this.productsRepository.create({
          productName,
          quantity,
          unity,
          buyingPrice,
          totalBuyingCost,
          sellingPrice,
          totalSoldQtyLoan,
          totalSoldQtyCash,
          totalSalesLoan,
          totalSalesCash,
          remainingQty,
          remainingBuying,
          remainingSales
        }));
      }

      if (products.length === 0) {
        throw new BadRequestException('No valid products found in Excel file');
      }

      console.log(`Processing ${products.length} products`);
      const savedProducts = await this.productsRepository.save(products);

      return {
        message: 'Products uploaded successfully',
        productsAdded: savedProducts.length
      };
    } catch (error) {
      console.error('Error processing Excel file:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to process Excel file: ${error.message}`);
    }
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Product> {
    return this.productsRepository.findOneBy({ id });
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // If quantity is provided, add it to the existing quantity
    if (updateProductDto.quantity !== undefined) {
      updateProductDto.quantity = product.quantity + updateProductDto.quantity;
    }

    // Calculate derived fields if quantity, buyingPrice, or sellingPrice changes
    let remainingQty = product.remainingQty;
    let remainingBuying = product.remainingBuying;
    let remainingSales = product.remainingSales;

    if (updateProductDto.quantity !== undefined) {
      remainingQty = updateProductDto.quantity - (product.totalSoldQtyCash + product.totalSoldQtyLoan);
    }

    if (updateProductDto.buyingPrice !== undefined || remainingQty !== product.remainingQty) {
      const buyingPrice = updateProductDto.buyingPrice ?? product.buyingPrice;
      remainingBuying = remainingQty * buyingPrice;
    }

    if (updateProductDto.sellingPrice !== undefined || remainingQty !== product.remainingQty) {
      const sellingPrice = updateProductDto.sellingPrice ?? product.sellingPrice;
      remainingSales = remainingQty * sellingPrice;
    }

    const updatedProduct = {
      ...product,
      ...updateProductDto,
      // Preserve original name and unity
      productName: product.productName,
      unity: product.unity,
      // Update calculated fields
      remainingQty,
      remainingBuying,
      remainingSales,
      totalBuyingCost: (updateProductDto.quantity ?? product.quantity) * (updateProductDto.buyingPrice ?? product.buyingPrice)
    };

    return this.productsRepository.save(updatedProduct);
  }
} 