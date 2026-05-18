import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PostgresMemberRepository } from './infrastructure/PostgresMemberRepository.js';
import { MemberValidator } from './domain/services/MemberValidator.js';
import { CreateMemberUseCase } from './application/NewMemberUseCase.js';
import { GetMembersUseCase } from './application/GetMembersUseCase.js';
import { UpdateMemberUseCase } from './application/UpdateMemberUseCase.js';
import { DeleteMemberUseCase } from './application/DeleteMemberUseCase.js';
import { MemberController } from './delivery/MemberController.js';

//Payment
import { PostgresPaymentRepository } from './infrastructure/PostgresPaymentRepository.js';
import { PaymentController } from './delivery/PaymentController.js';
import { PrismaClient } from './generated/client/index.js';

// Medical-certificate
import { PostgresMedicalCertificateRepository } from './infrastructure/PostgresMedicalCertificateRepository.js';
import { CreateMedicalCertificateUseCase } from './application/medical-certificate/CreateMedicalCertificateUseCase.js';
import { GetMedicalCertificatesUseCase } from './application/medical-certificate/GetMedicalCertificatesUseCase.js';
import { UpdateMedicalCertificateUseCase } from './application/medical-certificate/UpdateMedicalCertificateUseCase.js';
import { DeleteMedicalCertificateUseCase } from './application/medical-certificate/DeleteMedicalCertificateUseCase.js';
import { MedicalCertificateController } from './delivery/MedicalCertificateController.js';

//Sport
import { PostgresSportRepository } from './infrastructure/PostgresSportRepository.js';
import { CreateSportUseCase } from './application/sports/NewSportUseCase.js';
import { UpdateSportUseCase } from './application/sports/UpdateSportUseCase.js';
import { DeleteSportUseCase } from './application/sports/DeleteSportUseCase.js';
import { SportController } from './delivery/SportController.js';
import { GetSportsUseCase } from './application/sports/GetSportsUseCase.js';

//Lockers
import { PostgresLockerRepository } from './infrastructure/PostgresLockerRepository.js';
import { LockerValidator } from './domain/services/LockerValidator.js';
import { CreateLockerUseCase } from './application/locker/NewLockerUseCase.js';
import { LockerController } from './delivery/LockerController.js';
import { UpdateLockerUseCase } from './application/locker/UpdateLockerUseCase.js';
import { GetLockersUseCase } from './application/locker/GetLockersUseCase.js';
import { DeleteLockerUseCase } from './application/locker/DeleteLockerUseCase.js';

export function buildApp() {
    const server = Fastify({
        logger: {
            level: 'info',
            transport: process.env.NODE_ENV === 'development' 
            ? {
                target: 'pino-pretty',
                options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
                } 
            : undefined,
        },
    });

    server.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });

    const memberRepo = new PostgresMemberRepository();
    const memberValidator = new MemberValidator(memberRepo);
    
    const createMemberUseCase = new CreateMemberUseCase(memberRepo, memberValidator);
    const getMembersUseCase = new GetMembersUseCase(memberRepo);
    const updateMemberUseCase = new UpdateMemberUseCase(memberRepo, memberValidator);
    const deleteMemberUseCase = new DeleteMemberUseCase(memberRepo);
  
    const lockerRepo = new PostgresLockerRepository();
    const lockerValidator = new LockerValidator(lockerRepo);
    const createLockerUseCase = new CreateLockerUseCase(lockerRepo, lockerValidator);
    const getLockersUseCase = new GetLockersUseCase(lockerRepo);
    const updateLockerUseCase = new UpdateLockerUseCase(lockerRepo, lockerValidator, memberRepo);
    const deleteLockerUseCase = new DeleteLockerUseCase(lockerRepo);
    const lockerController = new LockerController(createLockerUseCase, getLockersUseCase, updateLockerUseCase, deleteLockerUseCase);

    const memberController = new MemberController(
        createMemberUseCase, 
        getMembersUseCase,
        updateMemberUseCase,
        deleteMemberUseCase
    );

    const paymentRepo = new PostgresPaymentRepository();
    const paymentController = new PaymentController(paymentRepo, memberRepo);
    const medicalCertificateRepo = new PostgresMedicalCertificateRepository();
    
    const createMedicalCertificateUseCase = new CreateMedicalCertificateUseCase(medicalCertificateRepo);
    const getMedicalCertificatesUseCase = new GetMedicalCertificatesUseCase(medicalCertificateRepo);
    const updateMedicalCertificateUseCase = new UpdateMedicalCertificateUseCase(medicalCertificateRepo);
    const deleteMedicalCertificateUseCase = new DeleteMedicalCertificateUseCase(medicalCertificateRepo);

    const medicalCertificateController = new MedicalCertificateController(
        createMedicalCertificateUseCase,
        getMedicalCertificatesUseCase,
        updateMedicalCertificateUseCase,
        deleteMedicalCertificateUseCase
    );
  
    const sportRepo = new PostgresSportRepository();
    const createSportUseCase = new CreateSportUseCase(sportRepo);
    const updateSportUseCase = new UpdateSportUseCase(sportRepo);
    const deleteSportUseCase = new DeleteSportUseCase(sportRepo);
    const getSportsUseCase = new GetSportsUseCase(sportRepo);

    const sportController = new SportController(
        createSportUseCase,
        getSportsUseCase,
        updateSportUseCase, 
        deleteSportUseCase
    );
  

    server.get('/api/v1/socios', memberController.getAll.bind(memberController));
    server.post('/api/v1/socios', memberController.create.bind(memberController));
    server.put('/api/v1/socios/:id', memberController.update.bind(memberController));
    server.delete('/api/v1/socios/:id', memberController.delete.bind(memberController));

    server.get('/api/v1/payments', paymentController.getAll.bind(paymentController));
    server.post('/api/v1/payments', paymentController.create.bind(paymentController));
    server.patch('/api/v1/payments/:id/pay', paymentController.pay.bind(paymentController));
    server.delete('/api/v1/payments/:id', paymentController.cancel.bind(paymentController));

    server.get('/api/v1/medical-certificates', medicalCertificateController.getAll.bind(medicalCertificateController));
    server.post('/api/v1/medical-certificates', medicalCertificateController.create.bind(medicalCertificateController));
    server.get('/api/v1/medical-certificates/member/:memberId', medicalCertificateController.getByMember.bind(medicalCertificateController));
    server.patch('/api/v1/medical-certificates/:id', medicalCertificateController.update.bind(medicalCertificateController));
    server.delete('/api/v1/medical-certificates/:id', medicalCertificateController.delete.bind(medicalCertificateController));

    server.get('/api/v1/sports', sportController.getAll.bind(sportController));
    server.post('/api/v1/sports', sportController.create.bind(sportController));
    server.patch('/api/v1/sports/:id', sportController.update.bind(sportController));
    server.delete('/api/v1/sports/:id', sportController.delete.bind(sportController));
  
    server.get('/api/v1/lockers', lockerController.getAll.bind(lockerController));
    server.post('/api/v1/lockers', lockerController.create.bind(lockerController));
    server.patch('/api/v1/lockers/:id', lockerController.update.bind(lockerController));
    server.delete('/api/v1/lockers/:id', lockerController.delete.bind(lockerController));
    
    server.get('/', async (req, rep) => {
        rep.status(200).send({ msg: 'asd' })
    });

    return server;
}

if (process.argv[1] && process.argv[1].endsWith('app.ts')) {
    const server = buildApp();
    const port = parseInt(process.env.PORT || '3000', 10);

    server.listen({ port, host: '0.0.0.0' }, () =>
        server.log.info(`API server running on http://localhost:${port}`)
    );

    ['SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, async () => {
            await server.close();
            process.exit(0);
        });
    });
}

