from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Set up initial data for the application'

    def handle(self, *args, **options):
        self.stdout.write('Creating migrations...')
        call_command('makemigrations')
        
        self.stdout.write('Applying migrations...')
        call_command('migrate')
        
        self.stdout.write('Loading initial scenarios...')
        call_command('loaddata', 'scenarios/fixtures/initial_scenarios.json')
        
        self.stdout.write(
            self.style.SUCCESS('Successfully set up initial data')
        )
